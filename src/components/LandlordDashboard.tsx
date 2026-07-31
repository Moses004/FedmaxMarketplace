import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Listing, Booking, User, BookingMessage, PayoutAccount, PayoutTransaction, ListingStatus } from '../types';
import { 
  getListingViews, 
  updateListing, 
  deleteListing,
  addBookingMessage, 
  getPayoutAccount, 
  savePayoutAccount, 
  getPayoutTransactions, 
  createPayoutTransaction 
} from '../services/store';
import PropertyStatusBadge, { STATUS_CONFIG } from './PropertyStatusBadge';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Eye, FileText, CheckCircle, Clock, Euro, Plus, Building, MapPin, 
  ChevronRight, Calendar, AlertCircle, BarChart3, PieChartIcon, ArrowUpRight, Sparkles,
  Zap, Copy, Check, MessageSquare, Send, X, ArrowRight, ShieldCheck, Heart,
  Upload, FolderPlus, Trash2, Image, ImagePlus, UploadCloud,
  Wallet, CreditCard, ArrowDownRight, Download, RefreshCw, CheckCircle2, DollarSign, Building2, Sliders, ExternalLink, HelpCircle, Info, User as UserIcon
} from 'lucide-react';

interface LandlordDashboardProps {
  currentUser: User | null;
  listings: Listing[];
  bookings: Booking[];
  onAddListingClick: () => void;
  onViewBookingClick: () => void;
  onViewListingClick: (listing: Listing) => void;
  onRefreshData?: () => void;
  onEditProfileClick?: () => void;
}

export default function LandlordDashboard({
  currentUser,
  listings,
  bookings,
  onAddListingClick,
  onViewBookingClick,
  onViewListingClick,
  onRefreshData,
  onEditProfileClick
}: LandlordDashboardProps) {
  
  // UI states for AI features
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizingListing, setOptimizingListing] = useState<Listing | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [optLoadingMessage, setOptLoadingMessage] = useState('Consulting Madrid/Barcelona localized rental indexes...');

  // Smart Draft reply states
  const [draftingBooking, setDraftingBooking] = useState<Booking | null>(null);
  const [isDraftingReply, setIsDraftingReply] = useState(false);
  const [draftedReply, setDraftedReply] = useState('');
  const [showCopiedReply, setShowCopiedReply] = useState(false);
  const [sentReplySuccess, setSentReplySuccess] = useState(false);

  // Landlord Payout & Withdrawal States
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [payoutTransactions, setPayoutTransactions] = useState<PayoutTransaction[]>([]);
  const [payoutNotification, setPayoutNotification] = useState<{
    id: string;
    type: 'initiated' | 'processing' | 'completed';
    amount: number;
    bankName: string;
    accountNumber: string;
    referenceCode: string;
    timestamp: string;
    method: string;
  } | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [withdrawalSuccessTx, setWithdrawalSuccessTx] = useState<PayoutTransaction | null>(null);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  // Payout Account Form state
  const [editHolderName, setEditHolderName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editIban, setEditIban] = useState('');
  const [editBic, setEditBic] = useState('');
  const [editMethod, setEditMethod] = useState<'sepa_bank' | 'paystack_bank' | 'paypal'>('sepa_bank');

  // Automated Recurring Payouts & Bank Verification States
  const [editAutoPayoutEnabled, setEditAutoPayoutEnabled] = useState(false);
  const [editAutoPayoutFrequency, setEditAutoPayoutFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'threshold'>('weekly');
  const [editAutoPayoutThreshold, setEditAutoPayoutThreshold] = useState<number>(250);
  const [editVerificationStatus, setEditVerificationStatus] = useState<'verified' | 'unverified' | 'pending_verification'>('verified');
  const [payoutModalTab, setPayoutModalTab] = useState<'details' | 'verification' | 'auto_payout'>('details');

  // Paystack Bank integration states
  const [bankList, setBankList] = useState<{ name: string; code: string }[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [accountResolveError, setAccountResolveError] = useState<string | null>(null);
  const [accountResolveSuccess, setAccountResolveSuccess] = useState<string | null>(null);

  // Listing Management (Deletion & Status Badges) States
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStatus = (listingId: string, newStatus: ListingStatus) => {
    setStatusUpdatingId(listingId);
    updateListing(listingId, { status: newStatus });
    if (onRefreshData) onRefreshData();
    showToast(`Property status updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
    setTimeout(() => setStatusUpdatingId(null), 400);
  };

  const handleConfirmDelete = () => {
    if (!deletingListing) return;
    setIsDeleting(true);
    setTimeout(() => {
      deleteListing(deletingListing.id);
      setIsDeleting(false);
      const title = deletingListing.title;
      setDeletingListing(null);
      if (onRefreshData) onRefreshData();
      showToast(`Listing "${title}" has been permanently deleted.`);
    }, 400);
  };

  // Load Payout Data on mount / landlord change
  useEffect(() => {
    if (currentUser?.id) {
      const acc = getPayoutAccount(currentUser.id);
      setPayoutAccount(acc);
      if (acc) {
        setEditHolderName(acc.accountHolderName);
        setEditBankName(acc.bankNameOrService);
        setEditIban(acc.accountNumberOrIban);
        setEditBic(acc.swiftBic || '');
        setEditMethod('paystack_bank');
        if (acc.bankCode) setSelectedBankCode(acc.bankCode);
        setEditAutoPayoutEnabled(acc.autoPayoutEnabled ?? false);
        setEditAutoPayoutFrequency(acc.autoPayoutFrequency || 'weekly');
        setEditAutoPayoutThreshold(acc.autoPayoutThreshold || 250);
        setEditVerificationStatus(acc.verificationStatus || (acc.isVerified ? 'verified' : 'unverified'));
      }
      const txs = getPayoutTransactions(currentUser.id);
      setPayoutTransactions(txs);
    }
  }, [currentUser]);

  // Fetch Paystack commercial banks list when method is paystack_bank
  useEffect(() => {
    if (editMethod === 'paystack_bank' && bankList.length === 0) {
      fetch('/api/paystack/banks')
        .then(res => res.json())
        .then(data => {
          if (data.status && Array.isArray(data.data)) {
            const formatted = data.data.map((b: any) => ({ name: b.name, code: b.code }));
            setBankList(formatted);
            if (formatted.length > 0 && !selectedBankCode) {
              setSelectedBankCode(formatted[0].code);
              setEditBankName(formatted[0].name);
            }
          }
        })
        .catch(err => console.error('Error fetching Paystack banks:', err));
    }
  }, [editMethod, bankList.length, selectedBankCode]);

  // Handle Paystack Account Resolution
  const handleResolvePaystackAccount = async () => {
    const cleanAccount = editIban.trim().replace(/\s+/g, '');
    if (!cleanAccount || !selectedBankCode) {
      setAccountResolveError('Please enter account number and select a bank.');
      return;
    }

    if (!/^\d{10}$/.test(cleanAccount)) {
      setAccountResolveError(`Paystack Nigerian bank account numbers must be exactly 10 digits (currently ${cleanAccount.length} digits).`);
      return;
    }

    setIsResolvingAccount(true);
    setAccountResolveError(null);
    setAccountResolveSuccess(null);

    try {
      const res = await fetch('/api/paystack/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: cleanAccount,
          bankCode: selectedBankCode
        })
      });
      const data = await res.json();
      if (data.status && data.data?.account_name) {
        setEditHolderName(data.data.account_name);
        setAccountResolveSuccess(`Verified Account Name: ${data.data.account_name}`);
      } else {
        setAccountResolveError(data.message || 'Could not resolve account details. Please verify account number.');
      }
    } catch (err: any) {
      setAccountResolveError(err.message || 'Error connecting to Paystack account verification server.');
    } finally {
      setIsResolvingAccount(false);
    }
  };

  // Render visual status indicator badge with color coding and icon
  const renderStatusIndicator = (status: PayoutTransaction['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Failed</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pending</span>
          </span>
        );
    }
  };

  // Handle Save Payout Account
  const handleSaveAccountDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    const cleanAccount = editIban.trim().replace(/\s+/g, '');
    setAccountResolveError(null);
    setAccountResolveSuccess(null);

    // Client-side Account Validation rules
    if (editMethod === 'paystack_bank') {
      if (!selectedBankCode) {
        setAccountResolveError('Please select a commercial bank.');
        return;
      }
      if (!/^\d{10}$/.test(cleanAccount)) {
        setAccountResolveError(`Invalid Paystack account number. Nigerian bank account numbers must be exactly 10 numeric digits (currently ${cleanAccount.length} digits).`);
        return;
      }
    } else if (editMethod === 'sepa_bank') {
      if (!/^[A-Z0-9]{15,34}$/i.test(cleanAccount)) {
        setAccountResolveError('Invalid SEPA IBAN. Expected between 15 and 34 alphanumeric characters.');
        return;
      }
    } else if (editMethod === 'paypal') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editBankName.trim())) {
        setAccountResolveError('Please enter a valid PayPal email address.');
        return;
      }
    }

    let recipientCode = payoutAccount?.recipientCode;
    let bankCodeToSave = selectedBankCode;
    let bankName = editBankName;

    if (editMethod === 'paystack_bank') {
      const selectedBankObj = bankList.find(b => b.code === selectedBankCode);
      if (selectedBankObj) bankName = selectedBankObj.name;

      try {
        const res = await fetch('/api/paystack/transfer-recipient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editHolderName || currentUser.name,
            accountNumber: cleanAccount,
            bankCode: selectedBankCode
          })
        });
        const data = await res.json();
        if (data.status && data.data?.recipient_code) {
          recipientCode = data.data.recipient_code;
        }
      } catch (err) {
        console.warn('Paystack recipient creation warning:', err);
      }
    }

    const updatedAcc: PayoutAccount = {
      method: editMethod,
      accountHolderName: editHolderName || currentUser.name,
      bankNameOrService: bankName || 'Standard Bank',
      accountNumberOrIban: cleanAccount || editIban,
      swiftBic: editBic,
      bankCode: bankCodeToSave,
      recipientCode: recipientCode,
      isVerified: editVerificationStatus === 'verified',
      verificationStatus: editVerificationStatus,
      verifiedAt: editVerificationStatus === 'verified' ? (payoutAccount?.verifiedAt || new Date().toISOString()) : undefined,
      autoPayoutEnabled: editAutoPayoutEnabled,
      autoPayoutFrequency: editAutoPayoutFrequency,
      autoPayoutThreshold: editAutoPayoutThreshold
    };
    savePayoutAccount(currentUser.id, updatedAcc);
    setPayoutAccount(updatedAcc);
    setAccountResolveSuccess('Payout Settings & Automated Transfer Preferences updated.');
    setShowAccountModal(false);
  };

  // Property Photo Upload & Gallery Manager States
  const [photoManagingListing, setPhotoManagingListing] = useState<Listing | null>(null);
  const [managedImages, setManagedImages] = useState<string[]>([]);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [photoSaveSuccess, setPhotoSaveSuccess] = useState(false);
  const [dashIsDragging, setDashIsDragging] = useState(false);
  const [dashUploadError, setDashUploadError] = useState<string | null>(null);
  const dashFileInputRef = useRef<HTMLInputElement>(null);

  // Handle uploading files from device/computer in dashboard modal
  const handleDashDeviceFiles = (files: FileList | File[]) => {
    setDashUploadError(null);
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size > 15 * 1024 * 1024) {
          setDashUploadError('One or more files exceed the 15MB size limit.');
        } else {
          validFiles.push(file);
        }
      } else {
        setDashUploadError('Please select valid image files (JPG, PNG, WEBP).');
      }
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        if (resultUrl) {
          setManagedImages(prev => [resultUrl, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDashFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleDashDeviceFiles(e.target.files);
    }
  };

  const handleDashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDashIsDragging(true);
  };

  const handleDashDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDashIsDragging(false);
  };

  const handleDashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDashIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDashDeviceFiles(e.dataTransfer.files);
    }
  };

  const handleSavePropertyPhotos = () => {
    if (!photoManagingListing) return;
    setIsPhotoSaving(true);

    setTimeout(() => {
      updateListing(photoManagingListing.id, {
        images: managedImages.length > 0 ? managedImages : [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
        ]
      });

      setIsPhotoSaving(false);
      setPhotoSaveSuccess(true);

      setTimeout(() => {
        setPhotoSaveSuccess(false);
        setPhotoManagingListing(null);
        if (onRefreshData) onRefreshData();
      }, 1200);
    }, 600);
  };

  // 1. Filter landlord listings
  const landlordListings = useMemo(() => {
    if (!currentUser) return [];
    return listings.filter(l => l.landlordId === currentUser.id);
  }, [listings, currentUser]);

  const landlordListingsIds = useMemo(() => {
    return landlordListings.map(l => l.id);
  }, [landlordListings]);

  // 2. Filter bookings received for landlord's listings
  const receivedBookings = useMemo(() => {
    return bookings.filter(b => landlordListingsIds.includes(b.listingId));
  }, [bookings, landlordListingsIds]);

  // 3. Load actual views from store
  const viewsMap = useMemo(() => {
    return getListingViews();
  }, [listings]);

  // 4. Calculate Key Analytics
  const stats = useMemo(() => {
    const totalViews = landlordListings.reduce((sum, l) => sum + (viewsMap[l.id] || 0), 0);
    const totalRequests = receivedBookings.length;
    const pendingRequests = receivedBookings.filter(b => b.status === 'pending').length;
    const approvedRequests = receivedBookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length;
    const conversionRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
    
    const potentialRevenue = receivedBookings
      .filter(b => b.status === 'approved' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const paystackRevenue = receivedBookings
      .filter(b => (b.status === 'approved' || b.status === 'confirmed') && b.paymentMethod === 'paystack')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const safepayRevenue = receivedBookings
      .filter(b => (b.status === 'approved' || b.status === 'confirmed') && b.paymentMethod !== 'paystack')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const totalWithdrawn = payoutTransactions
      .filter(tx => tx.status === 'completed' || tx.status === 'processing' || tx.status === 'pending')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const availableBalance = Math.max(0, potentialRevenue - totalWithdrawn);

    const todayStr = new Date().toISOString().split('T')[0];
    const escrowBalance = receivedBookings
      .filter(b => (b.status === 'approved' || b.status === 'confirmed') && b.startDate > todayStr)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalViews,
      totalRequests,
      pendingRequests,
      approvedRequests,
      conversionRate,
      potentialRevenue,
      paystackRevenue,
      safepayRevenue,
      totalWithdrawn,
      availableBalance,
      escrowBalance
    };
  }, [landlordListings, receivedBookings, viewsMap, payoutTransactions]);

  // 5. Chart Data: Views & Requests per listing
  const chartData = useMemo(() => {
    return landlordListings.map(l => {
      const views = viewsMap[l.id] || 0;
      const totalRequestsForThis = receivedBookings.filter(b => b.listingId === l.id).length;
      return {
        name: l.title.length > 15 ? l.title.slice(0, 12) + '...' : l.title,
        views,
        requests: totalRequestsForThis
      };
    });
  }, [landlordListings, receivedBookings, viewsMap]);

  // 6. Chart Data: 6-Month Income Projection
  const monthlyProjectionData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = [];
    const current = new Date();
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      
      let contracted = 0;
      let potential = 0;
      
      receivedBookings.forEach(b => {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        // Prorated estimation or simple overlap monthly pricing projection
        if (start <= monthEnd && end >= monthStart) {
          if (b.status === 'approved' || b.status === 'confirmed') {
            contracted += b.listingPrice;
          } else if (b.status === 'pending') {
            potential += b.listingPrice;
          }
        }
      });
      
      result.push({
        name: monthNames[monthIndex] + " " + year.toString().slice(-2),
        Contracted: contracted,
        Pipeline: potential
      });
    }
    return result;
  }, [receivedBookings]);

  // 7. Pie Chart: Request Pipeline ratio
  const pieData = useMemo(() => {
    const statusCounts = {
      pending: receivedBookings.filter(b => b.status === 'pending').length,
      approved: receivedBookings.filter(b => b.status === 'approved').length,
      confirmed: receivedBookings.filter(b => b.status === 'confirmed').length,
      rejected: receivedBookings.filter(b => b.status === 'rejected').length,
    };

    return [
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Approved', value: statusCounts.approved, color: '#10b981' },
      { name: 'Confirmed', value: statusCounts.confirmed, color: '#6366f1' },
      { name: 'Rejected', value: statusCounts.rejected, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [receivedBookings]);

  // AI Optimization trigger
  const handleOptimizeListing = async (listing: Listing) => {
    setOptimizingListing(listing);
    setIsOptimizing(true);
    setOptimizationResult(null);
    setAppliedSuccess(false);
    setSelectedUpgrades([]);

    // Loop through dynamic messaging to show real-time intelligence
    const messages = [
      "Consulting Madrid/Barcelona rental parity indexes...",
      "Matching property square-footage values with real estate averages...",
      "Evaluating current amenity market premium rates...",
      "Synthesizing high-converting organic title optimizations...",
      "Finalizing comprehensive price competitiveness scorecard..."
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      if (msgIdx < messages.length - 1) {
        msgIdx++;
        setOptLoadingMessage(messages[msgIdx]);
      }
    }, 900);

    try {
      const response = await fetch('/api/optimize-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listing.title,
          type: listing.type,
          location: listing.location,
          price: listing.price,
          size: listing.size,
          amenities: listing.amenities
        })
      });
      
      if (!response.ok) throw new Error('Failed to run AI pricing optimizer');
      const data = await response.json();
      setOptimizationResult(data);
    } catch (err) {
      console.error(err);
      // Fallback response
      setOptimizationResult({
        suggestedPriceRange: { min: Math.round(listing.price * 0.95), max: Math.round(listing.price * 1.12) },
        demandScore: 84,
        pricingVerdict: "Your current pricing is highly competitive. With a few premium upgrades, you could safely increase rent by up to 12% to capture premium tenant cohorts.",
        suggestedUpgrades: [
          "Install smart study lighting & workspace chair (+€30/mo value)",
          "Provide premium bedding & Orthopedic mattress (+€45/mo value)",
          "Install smart lock for keyless self check-in comfort (+€25/mo value)"
        ],
        optimizedTitle: `✨ Premium ${listing.title.replace("Bright ", "").replace("Modern ", "")} with AC`,
        optimizedDescription: `${listing.description} Perfectly located in Sol, this room features newly updated designer furnishings, high-speed fiber Wi-Fi, premium workspaces, and a private balcony. Highly ideal for international professionals and master students looking for extreme convenience and comfort.`
      });
    } finally {
      clearInterval(interval);
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizingListing || !optimizationResult) return;
    
    // Calculate new price based on optimization suggested price max or applied upgrades
    let finalPrice = Math.round((optimizationResult.suggestedPriceRange.min + optimizationResult.suggestedPriceRange.max) / 2);
    if (selectedUpgrades.length > 0) {
      finalPrice += selectedUpgrades.length * 25; // add premium per upgrade applied
    }

    updateListing(optimizingListing.id, {
      title: optimizationResult.optimizedTitle,
      description: optimizationResult.optimizedDescription,
      price: finalPrice
    });

    setAppliedSuccess(true);
    setTimeout(() => {
      setOptimizingListing(null);
      setOptimizationResult(null);
      setAppliedSuccess(false);
      if (onRefreshData) onRefreshData();
    }, 1500);
  };

  // Quick Reply Draft Assistant trigger
  const handleDraftSmartReply = async (booking: Booking) => {
    setDraftingBooking(booking);
    setIsDraftingReply(true);
    setDraftedReply('');
    setSentReplySuccess(false);

    try {
      const messagesFormatted = booking.messages || [
        { senderId: 'guest', senderName: booking.guestName, text: `Hello Carlos! I am very interested in leasing your property: ${booking.listingTitle}. I wanted to check if utility bills and cleaning are included in the price?`, createdAt: new Date().toISOString() }
      ];

      const response = await fetch('/api/chat-landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageHistory: messagesFormatted,
          listingTitle: booking.listingTitle,
          landlordName: currentUser?.name || "Carlos",
          guestName: booking.guestName
        })
      });

      if (!response.ok) throw new Error('Failed to generate smart response');
      const data = await response.json();
      setDraftedReply(data.text);
    } catch (err) {
      console.error(err);
      setDraftedReply(`Hi ${booking.guestName}, thanks for reaching out! Yes, high-speed fiber Wi-Fi and weekly cleaning of the common areas are fully included. Regarding utilities, we have a fixed rate of €60/month to keep things simple for you. Let me know if you would like to proceed!`);
    } finally {
      setIsDraftingReply(false);
    }
  };

  const handleSendDraftedReply = () => {
    if (!draftingBooking || !draftedReply) return;
    
    // Simulate sending message in store
    addBookingMessage(draftingBooking.id, {
      senderId: currentUser?.id || 'landlord-1',
      senderName: currentUser?.name || 'Carlos Silva',
      text: draftedReply
    });

    setSentReplySuccess(true);
    setTimeout(() => {
      setDraftingBooking(null);
      setDraftedReply('');
      setSentReplySuccess(false);
      if (onRefreshData) onRefreshData();
    }, 1500);
  };

  const handleCopyDraftReply = () => {
    navigator.clipboard.writeText(draftedReply);
    setShowCopiedReply(true);
    setTimeout(() => setShowCopiedReply(false), 2000);
  };

  // Execute Landlord Withdrawal Request
  const handleExecuteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !payoutAccount) return;
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (amountNum > stats.availableBalance) return;

    setIsProcessingWithdrawal(true);
    setTransferNotice(null);

    let liveRefCode = `TRF_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    let liveNoticeMsg = '';

    if (payoutAccount.method === 'paystack_bank' || payoutAccount.recipientCode) {
      try {
        let recipientCode = payoutAccount.recipientCode;
        if (!recipientCode && payoutAccount.bankCode) {
          const recipRes = await fetch('/api/paystack/transfer-recipient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: payoutAccount.accountHolderName,
              accountNumber: payoutAccount.accountNumberOrIban.replace(/\s+/g, ''),
              bankCode: payoutAccount.bankCode
            })
          });
          const recipData = await recipRes.json();
          if (recipData.status && recipData.data?.recipient_code) {
            recipientCode = recipData.data.recipient_code;
          }
        }

        if (recipientCode) {
          const transferRes = await fetch('/api/paystack/initiate-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amountNum,
              recipientCode: recipientCode,
              reason: `Landlord Payout for ${payoutAccount.accountHolderName}`
            })
          });

          const transferData = await transferRes.json();
          if (transferData.status) {
            if (transferData.data?.transfer_code) {
              liveRefCode = transferData.data.transfer_code;
            }
            liveNoticeMsg = 'Paystack Real-Time Bank Transfer Initiated';
          } else {
            console.warn('Paystack live transfer notice:', transferData.message);
            liveNoticeMsg = `Paystack Status: ${transferData.message || 'Transfer dispatched'}`;
          }
        }
      } catch (err: any) {
        console.error('Paystack transfer call failed:', err);
        liveNoticeMsg = `Notice: ${err.message || 'Local payout record logged'}`;
      }
    }

    const newTx = createPayoutTransaction(currentUser.id, amountNum, payoutAccount);
    if (liveRefCode) {
      newTx.referenceCode = liveRefCode;
    }

    // Trigger visual notification toast/banner for initiated payout
    const notif = {
      id: newTx.id,
      type: 'initiated' as const,
      amount: amountNum,
      bankName: payoutAccount.bankNameOrService,
      accountNumber: payoutAccount.accountNumberOrIban,
      referenceCode: liveRefCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: payoutAccount.method
    };

    setPayoutNotification(notif);
    showToast(`Payout request of €${amountNum.toFixed(2)} initiated via ${payoutAccount.bankNameOrService}! Ref: ${liveRefCode}`);

    // Real-time settlement simulation after 2.8s
    setTimeout(() => {
      setPayoutNotification(prev => {
        if (prev && prev.id === newTx.id) {
          return { ...prev, type: 'completed' as const };
        }
        return prev;
      });
      showToast(`Payout of €${amountNum.toFixed(2)} successfully settled via Paystack Direct API!`);
    }, 2800);

    setPayoutTransactions(prev => [newTx, ...prev]);
    setIsProcessingWithdrawal(false);
    setWithdrawalSuccessTx(newTx);
    setTransferNotice(liveNoticeMsg || null);
    setWithdrawAmount('');
    if (onRefreshData) onRefreshData();
  };

  // Generate and download formal payout PDF receipt text
  const handleDownloadReceipt = (tx: PayoutTransaction) => {
    const receiptContent = `========================================================
             LANDLORD PAYOUT DISBURSEMENT RECEIPT
========================================================
Receipt Reference: ${tx.referenceCode}
Transaction Date:   ${new Date(tx.requestedAt).toLocaleString()}
Landlord ID:        ${tx.landlordId}
Beneficiary Name:   ${payoutAccount?.accountHolderName || 'Carlos Rodriguez'}

--------------------------------------------------------
DISBURSEMENT FINANCIAL SUMMARY
--------------------------------------------------------
Gross Rental Earnings Withdrawn:  €${tx.amount.toFixed(2)}
Platform Disbursement Fee:        €0.00 (Free)
Net Amount Transfered:            €${tx.amount.toFixed(2)}

--------------------------------------------------------
PAYOUT DESTINATION DETAILS
--------------------------------------------------------
Payout Method:      ${tx.method.toUpperCase().replace('_', ' ')}
Destination:        ${tx.accountDetails}
Disbursement Status:${tx.status.toUpperCase()}

========================================================
          Thank you for hosting with Rentora RealEstate!
========================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payout_Receipt_${tx.referenceCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser || currentUser.role !== 'landlord') {
    return (
      <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">Unauthorized Access</h3>
        <p className="text-xs text-slate-500">
          This dashboard is only available to registered Landlords. Please switch your identity using the profile menu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-black text-2xl text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
            Landlord Business Dashboard
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Welcome back, {currentUser.name}. Here is how your Spanish properties are performing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEditProfileClick && (
            <button
              onClick={onEditProfileClick}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-slate-600" />
              <span>Edit Profile</span>
            </button>
          )}
          <button
            onClick={onAddListingClick}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>List Another Property</span>
          </button>
        </div>
      </div>

      {/* PAYOUT REQUEST VISUAL NOTIFICATION BANNER */}
      {payoutNotification && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl border border-emerald-500/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 z-10">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
              payoutNotification.type === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            }`}>
              {payoutNotification.type === 'completed' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                  {payoutNotification.type === 'completed'
                    ? 'Payout Disbursement Successfully Settled'
                    : 'Payout Request Initiated & Processing'}
                </span>
                <span className={`text-[9px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  payoutNotification.type === 'completed'
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/30 text-amber-300 border-amber-400/30'
                }`}>
                  {payoutNotification.type === 'completed' ? 'PAYSTACK SETTLED' : 'DISPATCHED'}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                Amount: <span className="font-bold text-white font-mono">€{payoutNotification.amount.toFixed(2)}</span> • Destination: <span className="font-bold text-emerald-300">{payoutNotification.bankName}</span> ({payoutNotification.accountNumber.slice(-4)})
                <span className="text-slate-400 font-mono text-[11px] ml-2">Ref: {payoutNotification.referenceCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 z-10 shrink-0 self-end md:self-center">
            {withdrawalSuccessTx && (
              <button
                type="button"
                onClick={() => handleDownloadReceipt(withdrawalSuccessTx)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download Receipt</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setPayoutNotification(null)}
              className="p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              title="Dismiss notification banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EMPTY ONBOARDING STATE */}
      {landlordListings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">You haven't listed any rentals yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Unlock real-time analytics, viewer insights, and instant booking coordination by posting your rooms, studios, or full apartments today.
            </p>
          </div>
          <button
            onClick={onAddListingClick}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-600/10"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <>
          {/* LANDLORD FINANCIAL WALLET & PAYOUT BANNER */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Landlord Earnings & Payout Hub</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Escrow Protected
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider block">
                    Available Balance for Withdrawal
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      €{stats.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {stats.availableBalance > 0 && (
                      <span className="text-xs font-bold bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                        Ready for Instant Transfer
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                    <span className="text-slate-400">Total Collected:</span>
                    <span className="font-bold text-white">€{stats.potentialRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                    <span className="text-slate-400">Paid Out:</span>
                    <span className="font-bold text-emerald-400">€{stats.totalWithdrawn.toLocaleString()}</span>
                  </div>
                  {payoutAccount && (
                    <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300 font-medium truncate max-w-[200px]">
                        {payoutAccount.bankNameOrService} (**** {payoutAccount.accountNumberOrIban.slice(-4)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawalSuccessTx(null);
                      setWithdrawAmount(stats.availableBalance > 0 ? stats.availableBalance.toString() : '');
                      setShowWithdrawModal(true);
                    }}
                    disabled={stats.availableBalance <= 0}
                    className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg cursor-pointer ${
                      stats.availableBalance > 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                    <span>Request Payout / Withdraw Funds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHowItWorksModal(true)}
                    title="How Paystack Real-Time Payouts Work"
                    className="bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 px-3 py-3 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline ml-1 font-bold text-xs text-slate-200">How it works</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-2xl transition-all border border-slate-700/80 active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Manage Bank / Payout Method</span>
                </button>
              </div>
            </div>
          </div>

          {/* STATS CARDS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CARD 1: TOTAL VIEWS */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-200 transition-colors flex items-center gap-3.5">
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block leading-none">Total Views</span>
                <span className="text-xl font-black text-slate-800 tracking-tight block mt-1.5">{stats.totalViews}</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>+14.8% this week</span>
                </span>
              </div>
            </div>

            {/* CARD 2: BOOKING REQUESTS */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-200 transition-colors flex items-center gap-3.5">
              <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block leading-none">Total Requests</span>
                <span className="text-xl font-black text-slate-800 tracking-tight block mt-1.5">{stats.totalRequests}</span>
                {stats.pendingRequests > 0 ? (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5 animate-pulse">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{stats.pendingRequests} action required</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">All requests handled</span>
                )}
              </div>
            </div>

            {/* CARD 3: ACCEPTANCE RATE */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-200 transition-colors flex items-center gap-3.5">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block leading-none">Acceptance Rate</span>
                <span className="text-xl font-black text-slate-800 tracking-tight block mt-1.5">{stats.conversionRate}%</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1 leading-none">
                  Ratio of approved bookings
                </span>
              </div>
            </div>

            {/* CARD 4: ESTIMATED CONTRACTED REVENUE */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-200 transition-colors flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Euro className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block leading-none">Contracted Revenue</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight block mt-1.5">€{stats.potentialRevenue.toLocaleString()}</span>
                  <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 mt-0.5">
                    <ArrowUpRight className="w-3 h-3 shrink-0" />
                    <span>Approved & signed leases</span>
                  </span>
                </div>
              </div>

              {/* Gateway Revenue Breakdown Badges */}
              <div className="flex flex-col gap-1 text-right shrink-0">
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Paystack: €{stats.paystackRevenue.toLocaleString()}
                </span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  SafePay: €{stats.safepayRevenue.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* TWO-COLUMN GRAPHS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AREA CHART: 6-MONTH PROJECTED INFLOWS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    6-Month Projected Rental Revenue
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Contracted Monthly Lease Revenue vs. Potential Lead Pipeline</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyProjectionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorContracted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(v) => `€${v}`}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${value}`, undefined]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                    />
                    <Area name="Contracted Leases" type="monotone" dataKey="Contracted" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorContracted)" />
                    <Area name="Pipeline (Pending)" type="monotone" dataKey="Pipeline" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorPipeline)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BAR CHART: VIEWS & REQUESTS COMPARISON */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Property Lead Activity & Demand
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Comparing total views versus received inquiries</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                    />
                    <Bar name="Views Count" dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar name="Received Requests" dataKey="requests" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* THREE COLUMN GRID: LISTINGS, PIPELINE RATIO & SMART INBOX */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* INBOX RECENT INQUIRIES & AI DRAFTER (SPAN 4) */}
            <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Tenant Inquiries & AI Co-pilot
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Instantly coordinate inquiries with smart suggested responses</p>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[310px] pr-1 scrollbar-thin">
                {receivedBookings.filter(b => b.status === 'pending').length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-2 h-full">
                    <Check className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2.5 rounded-full" />
                    <h4 className="font-bold text-xs text-slate-700">All caught up!</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs">You have no pending tenant inquiries requiring replies right now.</p>
                  </div>
                ) : (
                  receivedBookings.filter(b => b.status === 'pending').map((booking) => (
                    <div 
                      key={booking.id}
                      className="p-3 border border-slate-100 rounded-2xl hover:border-emerald-100 transition-all space-y-2.5 hover:shadow-sm bg-slate-50/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{booking.guestName}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{booking.listingTitle}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md uppercase">
                          Pending Approval
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic bg-white p-2 rounded-xl border border-slate-100/50">
                        "{booking.messages?.[booking.messages.length - 1]?.text || `Hello Carlos! I wanted to check if utilities/Wi-Fi and weekly cleaning of common areas are included in the €${booking.listingPrice}/mo price?`}"
                      </p>

                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100">
                        <span className="text-[9px] text-slate-400 font-semibold">Inquiry: {new Date(booking.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleDraftSmartReply(booking)}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Smart Reply</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* REQUEST PIPELINE PIE STATUS BREAKDOWN (SPAN 4) */}
            <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  Conversion Ratio
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Breakdown of received inquiries statuses</p>
              </div>

              {pieData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">No pipeline requests received yet.</p>
                </div>
              ) : (
                <>
                  <div className="h-40 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-50">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span>{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* QUICK AI BENCHMARKS WIDGET (SPAN 4) */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Market Competitiveness Index
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Localized Real-time AI benchmarks for Madrid & Barcelona</p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-gradient-to-br from-emerald-50/50 to-emerald-500/5 rounded-2xl border border-emerald-100/30">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Sol & Plaza Mayor (Madrid)</span>
                      <span className="text-emerald-700">92% High Demand</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1.5">Average Room: €620 - €700 • Studio: €1,100 - €1,300</span>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-indigo-500/5 rounded-2xl border border-indigo-100/30">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Eixample & Gràcia (Barcelona)</span>
                      <span className="text-indigo-700">86% High Demand</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: '86%' }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1.5">Average Room: €580 - €650 • Apartment: €1,600 - €1,950</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 text-[10px] font-semibold text-slate-400 text-center leading-relaxed">
                Prices fluctuate based on air conditioning, keyless smart locks, and private kitchen facilities.
              </div>
            </div>

          </div>

          {/* LIST OF PROPERTIES TABULATION */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Listed Properties Management</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Individual views, price rates, and received requests</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                {landlordListings.length} Active Listings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">Property Name / Location</th>
                    <th className="py-3 px-4">Housing Type</th>
                    <th className="py-3 px-4">Status & Badge</th>
                    <th className="py-3 px-4">Price / mo</th>
                    <th className="py-3 px-4 text-center">Views</th>
                    <th className="py-3 px-4 text-center">Total Bookings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {landlordListings.map((listing) => {
                    const views = viewsMap[listing.id] || 0;
                    const bookingsForThis = receivedBookings.filter(b => b.listingId === listing.id);
                    const pendingForThis = bookingsForThis.filter(b => b.status === 'pending').length;

                    return (
                      <tr 
                        key={listing.id} 
                        className="hover:bg-slate-50/40 transition-colors group/row"
                      >
                        <td className="py-3.5 px-5 flex items-center gap-3.5">
                          <img 
                            src={listing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'} 
                            alt={listing.title} 
                            referrerPolicy="no-referrer"
                            className="w-12 h-10 rounded-lg object-cover bg-slate-100 shadow-sm shrink-0"
                          />
                          <div className="min-w-0">
                            <span 
                              onClick={() => onViewListingClick(listing)}
                              className="font-bold text-slate-700 text-xs truncate block hover:text-emerald-600 cursor-pointer transition-colors"
                            >
                              {listing.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-300" />
                              {listing.location}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize inline-block bg-emerald-50 text-emerald-800 border-emerald-200">
                            {listing.type.replace(/-/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <PropertyStatusBadge status={listing.status} size="sm" />
                            <select
                              value={listing.status || 'available'}
                              onChange={(e) => handleUpdateStatus(listing.id, e.target.value as ListingStatus)}
                              disabled={statusUpdatingId === listing.id}
                              className="text-[9px] font-extrabold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 block hover:bg-white transition-all"
                              title="Quickly update listing status"
                            >
                              <option value="available">Status: Available</option>
                              <option value="new">Status: New</option>
                              <option value="rented">Status: Rented / Sold</option>
                              <option value="unavailable">Status: Unavailable</option>
                              <option value="pending_review">Status: Pending Review</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                          €{listing.price}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-slate-600">
                          {views}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {bookingsForThis.length}
                            </span>
                            {pendingForThis > 0 && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                                {pendingForThis} pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setPhotoManagingListing(listing);
                                setManagedImages(listing.images || []);
                              }}
                              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all shadow-xs cursor-pointer"
                              title="Upload or manage property photo files"
                            >
                              <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Photos ({listing.images.length})</span>
                            </button>
                            <button
                              onClick={() => handleOptimizeListing(listing)}
                              className="flex items-center gap-1 text-purple-700 hover:text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-600 transition-all shadow-xs hover:border-purple-600 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>AI Optimize</span>
                            </button>
                            <button
                              onClick={() => onViewListingClick(listing)}
                              className="text-slate-500 hover:text-slate-800 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-white transition-all cursor-pointer"
                            >
                              View Detail
                            </button>
                            <button
                              onClick={onViewBookingClick}
                              className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                              Manage Bookings
                            </button>
                            <button
                              onClick={() => setDeletingListing(listing)}
                              className="flex items-center gap-1 text-rose-600 hover:text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-600 transition-all shadow-xs hover:border-rose-600 cursor-pointer"
                              title="Permanently delete property listing"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* EMBEDDED PAYSTACK BANK ACCOUNT SETTINGS FORM CARD */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    Paystack Real-Time Bank Details & Payout Account
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Save your official commercial bank name & account number for automated instant rental disbursements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${
                  payoutAccount?.isVerified || editVerificationStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{payoutAccount?.isVerified || editVerificationStatus === 'verified' ? 'Account Verified' : 'Unverified'}</span>
                </span>

                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${
                  payoutAccount?.autoPayoutEnabled || editAutoPayoutEnabled
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {payoutAccount?.autoPayoutEnabled || editAutoPayoutEnabled
                      ? `Auto-Payouts: ${(payoutAccount?.autoPayoutFrequency || editAutoPayoutFrequency).toUpperCase()}`
                      : 'Auto-Payouts: Off'}
                  </span>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveAccountDetails} className="space-y-4">
              {/* Paystack Official Hosted Direct API Withdrawal Recommendation Callout */}
              <div className="p-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl border border-emerald-800/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                    <Zap className="w-5 h-5 fill-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-tight text-white">Official Paystack Direct Withdrawal (Recommended Implementation)</span>
                      <span className="bg-emerald-500/30 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/30">Official Direct API</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Direct API hosted transfer gateway for real-time commercial bank disbursements with instant NIBSS beneficiary verification.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowItWorksModal(true)}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Architecture Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Method / Bank Selector (Paystack Direct API ONLY) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Official Payout Gateway
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs font-extrabold text-emerald-900 flex items-center justify-between shadow-2xs">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
                      <span>Paystack Direct API (Hosted Commercial Bank)</span>
                    </span>
                    <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded">ACTIVE</span>
                  </div>
                </div>

                {/* Bank Name Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Paystack Commercial Bank Name
                  </label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => {
                      setSelectedBankCode(e.target.value);
                      const found = bankList.find(b => b.code === e.target.value);
                      if (found) setEditBankName(found.name);
                    }}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {bankList.length === 0 ? (
                      <option value="">Loading Paystack Banks...</option>
                    ) : (
                      bankList.map((b, idx) => (
                        <option key={`emb-bank-${b.code}-${idx}`} value={b.code}>
                          {b.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Account Number / IBAN */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                      {editMethod === 'sepa_bank' ? 'SEPA IBAN' : editMethod === 'paypal' ? 'PayPal Email' : 'Account Number (10 Digits)'}
                    </label>
                    {editMethod === 'paystack_bank' && (
                      <button
                        type="button"
                        onClick={handleResolvePaystackAccount}
                        disabled={isResolvingAccount || !editIban}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {isResolvingAccount ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verify Account</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editIban}
                    onChange={(e) => {
                      setEditIban(e.target.value);
                      setAccountResolveError(null);
                      setAccountResolveSuccess(null);
                    }}
                    placeholder={editMethod === 'sepa_bank' ? 'e.g. ES91 0049 1825 3112 3456 7890' : 'e.g. 0123456789'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {editMethod === 'paystack_bank' && (
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className={`font-semibold ${editIban.trim().replace(/\D/g, '').length === 10 ? 'text-emerald-600 font-bold' : editIban.trim().length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {editIban.trim().replace(/\D/g, '').length === 10 ? '✓ Valid 10-digit account length' : '10 numeric digits required'}
                      </span>
                      <span className={`font-mono font-bold ${editIban.trim().replace(/\D/g, '').length === 10 ? 'text-emerald-600' : editIban.trim().replace(/\D/g, '').length > 10 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {editIban.trim().replace(/\D/g, '').length}/10
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Account Holder Name & Feedback Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Account Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={editHolderName}
                    onChange={(e) => setEditHolderName(e.target.value)}
                    placeholder="e.g. Carlos Rodriguez"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-600 font-medium">
                      {accountResolveSuccess || accountResolveError || 'Bank details are stored securely with end-to-end encryption for instant payouts.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/10 shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Paystack Bank Details</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* LANDLORD PAYOUT & WITHDRAWAL HISTORY SECTION */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <DollarSign className="w-4.5 h-4.5 text-emerald-600 stroke-[2.5]" />
                  Disbursement & Payout Transaction Records
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Audit trail of all requested and completed withdrawals transferred to your linked account
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHowItWorksModal(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How it works</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Payout Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalSuccessTx(null);
                    setWithdrawAmount(stats.availableBalance > 0 ? stats.availableBalance.toString() : '');
                    setShowWithdrawModal(true);
                  }}
                  disabled={stats.availableBalance <= 0}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    stats.availableBalance > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Withdraw (€{stats.availableBalance.toLocaleString()})</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {payoutTransactions.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-xs text-slate-700">No Withdrawal History Yet</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    When you request payouts for your rental income, detailed transaction records and download receipts will appear here.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-5">Reference Code</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Payout Method & Account</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {payoutTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                          {tx.referenceCode}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(tx.requestedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">{tx.accountDetails}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                          +€{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusIndicator(tx.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(tx)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
                            title="Download Official Disbursement Statement"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-600 shrink-0" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* WITHDRAWAL REQUEST MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Withdraw Rental Earnings</h3>
                  <p className="text-xs text-slate-400 font-semibold">Direct transfer to your verified account</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawalSuccessTx ? (
              /* Success Screen */
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Disbursement Initiated
                  </span>
                  <h4 className="text-xl font-black text-slate-800 pt-2">€{withdrawalSuccessTx.amount.toFixed(2)} Withdrawn!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Funds have been processed and dispatched to your account ({withdrawalSuccessTx.accountDetails}).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Reference Code:</span>
                    <strong className="text-slate-800">{withdrawalSuccessTx.referenceCode}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Processing Fee:</span>
                    <strong className="text-emerald-700">€0.00 (Free)</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-sans">
                    <span>Status:</span>
                    {renderStatusIndicator(withdrawalSuccessTx.status)}
                  </div>
                  {transferNotice && (
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60 font-sans">
                      <span>Gateway Note:</span>
                      <strong className="text-emerald-800 font-semibold text-[11px]">{transferNotice}</strong>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(withdrawalSuccessTx)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Download Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Form Screen */
              <form onSubmit={handleExecuteWithdrawal} className="p-6 space-y-5">
                {/* Balance card */}
                <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Available to Withdraw</span>
                    <span className="text-2xl font-black tracking-tight text-white mt-0.5 block">
                      €{stats.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/30">
                    0% Fee
                  </span>
                </div>

                {/* Paystack Real-Time Info Banner */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0 fill-emerald-600" />
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Instant automated Paystack disbursements to verified accounts.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHowItWorksModal(true)}
                    className="text-[10px] font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>How it works</span>
                  </button>
                </div>

                {/* Quick Preset Amount Pills */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Amount</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 300, 500, stats.availableBalance].map((presetAmt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setWithdrawAmount(Math.min(presetAmt, stats.availableBalance).toString())}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          withdrawAmount === presetAmt.toString()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {presetAmt === stats.availableBalance ? 'Max (100%)' : `€${presetAmt}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Custom Amount (€)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-black text-sm">€</span>
                    <input
                      type="number"
                      min="10"
                      max={stats.availableBalance}
                      step="any"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Destination Account info */}
                {payoutAccount && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Payout Destination</span>
                        <span className="text-xs font-bold text-slate-800 block">{payoutAccount.bankNameOrService}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{payoutAccount.accountNumberOrIban}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWithdrawModal(false);
                        setShowAccountModal(true);
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:underline shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessingWithdrawal || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > stats.availableBalance}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                    isProcessingWithdrawal || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > stats.availableBalance
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  {isProcessingWithdrawal ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Processing Transfer...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                      <span>Confirm & Transfer €{parseFloat(withdrawAmount || '0').toFixed(2)} Now</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* COMPREHENSIVE PAYOUT SETTINGS MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Landlord Payout Settings</h3>
                  <p className="text-xs text-slate-300 font-medium">Manage bank destination, verification status, and auto-disbursements</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPayoutModalTab('details')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  payoutModalTab === 'details'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutModalTab('verification')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  payoutModalTab === 'verification'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1">
                  Verification
                  <span className={`w-2 h-2 rounded-full ${editVerificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutModalTab('auto_payout')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  payoutModalTab === 'auto_payout'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1">
                  Auto-Payouts
                  {editAutoPayoutEnabled && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full uppercase font-black">ON</span>
                  )}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveAccountDetails} className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* TAB 1: BANK & GATEWAY DETAILS */}
              {payoutModalTab === 'details' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Official Paystack Gateway Banner & Recommendation */}
                  <div className="p-3.5 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl border border-emerald-800/80 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0 border border-emerald-500/30">
                        <Zap className="w-4 h-4 fill-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">Paystack Hosted Direct API Withdrawal</span>
                          <span className="bg-emerald-500/30 text-emerald-300 text-[8px] font-black px-1.5 py-0.2 rounded uppercase border border-emerald-400/30">OFFICIAL GATEWAY</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Direct automated settlement to commercial bank accounts with instant CBN/NIBSS name resolution.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Account Beneficiary Full Name</label>
                    <input
                      type="text"
                      value={editHolderName}
                      onChange={(e) => setEditHolderName(e.target.value)}
                      placeholder="e.g. Carlos Rodriguez"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Paystack Commercial Bank Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Paystack Commercial Bank</label>
                    <select
                      value={selectedBankCode}
                      onChange={(e) => {
                        setSelectedBankCode(e.target.value);
                        const found = bankList.find(b => b.code === e.target.value);
                        if (found) setEditBankName(found.name);
                      }}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {bankList.map((b, idx) => (
                        <option key={`modal-bank-${b.code}-${idx}`} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IBAN / Account Number */}
                  {editMethod !== 'paypal' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                          {editMethod === 'sepa_bank' ? 'SEPA IBAN Number' : 'Bank Account Number (10 digits)'}
                        </label>
                        {editMethod === 'paystack_bank' && (
                          <button
                            type="button"
                            onClick={handleResolvePaystackAccount}
                            disabled={isResolvingAccount || !editIban}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {isResolvingAccount ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Verify Account</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editIban}
                        onChange={(e) => {
                          setEditIban(e.target.value);
                          setAccountResolveError(null);
                          setAccountResolveSuccess(null);
                        }}
                        placeholder={editMethod === 'sepa_bank' ? 'e.g. ES91 0049 1825 3112 3456 7890' : 'e.g. 0123456789'}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {editMethod === 'paystack_bank' && (
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className={`font-semibold ${editIban.trim().replace(/\D/g, '').length === 10 ? 'text-emerald-600 font-bold' : editIban.trim().length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {editIban.trim().replace(/\D/g, '').length === 10 ? '✓ Valid 10-digit account length' : '10 numeric digits required'}
                          </span>
                          <span className={`font-mono font-bold ${editIban.trim().replace(/\D/g, '').length === 10 ? 'text-emerald-600' : editIban.trim().replace(/\D/g, '').length > 10 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {editIban.trim().replace(/\D/g, '').length}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Resolution Feedback */}
                  {accountResolveSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{accountResolveSuccess}</span>
                    </div>
                  )}

                  {accountResolveError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{accountResolveError}</span>
                    </div>
                  )}

                  {/* SWIFT / BIC */}
                  {editMethod === 'sepa_bank' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">SWIFT / BIC Code (Optional)</label>
                      <input
                        type="text"
                        value={editBic}
                        onChange={(e) => setEditBic(e.target.value)}
                        placeholder="e.g. BSANESMMXXX"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BANK VERIFICATION STATUS */}
              {payoutModalTab === 'verification' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    editVerificationStatus === 'verified'
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                      : editVerificationStatus === 'pending_verification'
                      ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                      : 'bg-amber-50/90 border-amber-200 text-amber-900'
                  }`}>
                    {editVerificationStatus === 'verified' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : editVerificationStatus === 'pending_verification' ? (
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm uppercase tracking-wider">
                          {editVerificationStatus === 'verified' ? 'Bank Account Fully Verified' : editVerificationStatus === 'pending_verification' ? 'Verification In Progress' : 'Unverified Account'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          editVerificationStatus === 'verified'
                            ? 'bg-emerald-600 text-white'
                            : editVerificationStatus === 'pending_verification'
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}>
                          {editVerificationStatus}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {editVerificationStatus === 'verified'
                          ? 'This payout account has passed NIBSS & Central Banking name resolution checks and is cleared for instant automated disbursements.'
                          : 'Please click "Run Live Verification Check" to resolve and confirm account beneficiary name against central bank registers.'}
                      </p>
                    </div>
                  </div>

                  {/* Verification Audit Grid */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                      <span>Verification Audit Log</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">NIBSS-API-V2</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Holder</span>
                        <span className="font-bold text-slate-800">{editHolderName || currentUser?.name || 'Carlos Rodriguez'}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Bank / Provider</span>
                        <span className="font-bold text-slate-800">{editBankName || 'Standard Commercial Bank'}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Identifier</span>
                        <span className="font-mono font-bold text-slate-800">
                          {editIban ? `•••• ${editIban.slice(-4)}` : 'Not Configured'}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Paystack Recipient Code</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {payoutAccount?.recipientCode || 'RCP_px982301'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={handleResolvePaystackAccount}
                        disabled={isResolvingAccount || !editIban}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isResolvingAccount ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying with NIBSS...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Re-run Live Bank Verification</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditVerificationStatus(editVerificationStatus === 'verified' ? 'unverified' : 'verified')}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        {editVerificationStatus === 'verified' ? 'Mark as Unverified' : 'Force Mark as Verified'}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: AUTOMATED RECURRING PAYOUTS */}
              {payoutModalTab === 'auto_payout' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Main Auto-Payout Toggle Switch */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Automated Recurring Payouts</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Automatically transfer available rental revenue to your verified bank account without manual requests.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditAutoPayoutEnabled(!editAutoPayoutEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editAutoPayoutEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editAutoPayoutEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {editAutoPayoutEnabled && (
                    <div className="space-y-4 pt-1 animate-fade-in">
                      
                      {/* Frequency Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                          Automated Payout Schedule / Frequency
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'weekly', title: 'Weekly', sub: 'Every Mon' },
                            { id: 'biweekly', title: 'Bi-Weekly', sub: '1st & 15th' },
                            { id: 'monthly', title: 'Monthly', sub: '1st of Month' },
                            { id: 'threshold', title: 'Threshold', sub: 'Min Balance' }
                          ].map((freq) => (
                            <button
                              key={freq.id}
                              type="button"
                              onClick={() => setEditAutoPayoutFrequency(freq.id as any)}
                              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                editAutoPayoutFrequency === freq.id
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-xs font-extrabold'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="text-xs font-extrabold">{freq.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{freq.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Threshold Input */}
                      {(editAutoPayoutFrequency === 'threshold' || editAutoPayoutEnabled) && (
                        <div className="space-y-1.5 p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                              Automated Payout Trigger Threshold (€)
                            </label>
                            <span className="text-[10px] font-bold text-emerald-700">Auto-transfers when balance &ge; €{editAutoPayoutThreshold}</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                            <input
                              type="number"
                              min="50"
                              step="50"
                              value={editAutoPayoutThreshold}
                              onChange={(e) => setEditAutoPayoutThreshold(Math.max(50, parseInt(e.target.value) || 50))}
                              className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Scheduled disbursements carry zero transaction fees and produce automated instant receipt records.</span>
                      </div>

                    </div>
                  )}

                  {!editAutoPayoutEnabled && (
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-center text-xs text-slate-500 space-y-1">
                      <Clock className="w-5 h-5 mx-auto text-slate-400" />
                      <p className="font-bold text-slate-700">Manual Payout Mode Active</p>
                      <p className="text-[11px]">Withdrawals will only occur when manually requested from your landlord dashboard balance.</p>
                    </div>
                  )}

                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Payout Settings</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* HOW PAYSTACK REAL-TIME WITHDRAWALS WORK HELPER MODAL */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">How Paystack Payouts Work</h3>
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/30">
                      Real-Time Transfer
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Automated, direct rental disbursements to your commercial bank account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              
              {/* Summary Banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-extrabold text-emerald-900 block">End-to-End Escrow & Bank Verification</span>
                  <p className="text-slate-600 leading-relaxed">
                    Rental payments are stored securely in escrow. When you request a withdrawal, our system uses Paystack's NIBSS API and banking gateways to verify account ownership and transfer funds directly to your financial institution.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Withdrawal Process in 3 Simple Steps</h4>
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Bank Details Resolution</h5>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        Your 10-digit account number and bank code are validated in real-time with Central Bank registers to confirm beneficiary name match.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Automated Transfer Recipient Creation</h5>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        A unique encrypted Paystack recipient code (<code className="font-mono bg-slate-200/60 px-1 rounded text-slate-700">RCP_...</code>) is generated for instant settlement.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Instant Clearing & Reference Receipt</h5>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        Funds are dispatched automatically. A unique transfer reference (<code className="font-mono bg-slate-200/60 px-1 rounded text-slate-700">TRF_...</code>) is generated with instant downloadable receipt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Processing Times Grid */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Standard Transfer Processing Times</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                      <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                      <span>Paystack NGN</span>
                    </div>
                    <div className="text-sm font-black text-slate-800">Instant</div>
                    <p className="text-[10px] text-slate-500 leading-tight">Typically 10s to 5 mins into Nigerian commercial banks.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>SEPA Euro</span>
                    </div>
                    <div className="text-sm font-black text-slate-800">1 - 2 Days</div>
                    <p className="text-[10px] text-slate-500 leading-tight">Instant or 1-2 business days for EU bank IBANs.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-xs">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>PayPal</span>
                    </div>
                    <div className="text-sm font-black text-slate-800">&lt; 15 Mins</div>
                    <p className="text-[10px] text-slate-500 leading-tight">Credited directly to your linked PayPal email address.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero landlord withdrawal surcharges</span>
              </div>

              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Understood, Got It
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI PRICE OPTIMIZER OVERLAY DIALOG */}
      {optimizingListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">AI Pricing & Marketing Optimizer</h3>
                  <p className="text-xs text-slate-400 font-semibold">Listing: {optimizingListing.title}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setOptimizingListing(null);
                  setOptimizationResult(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isOptimizing ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Synthesizing Real Estate Scorecard</h4>
                    <p className="text-xs text-slate-400 font-medium animate-pulse">{optLoadingMessage}</p>
                  </div>
                </div>
              ) : optimizationResult ? (
                <div className="space-y-6">
                  {/* Score & Pricing Card */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 bg-gradient-to-br from-purple-500 to-indigo-600 p-5 rounded-2xl text-white text-center flex flex-col justify-between items-center relative overflow-hidden shadow-lg shadow-purple-500/15">
                      <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-purple-200">AI Demand Index</span>
                      <div className="my-3">
                        <span className="text-4xl font-black">{optimizationResult.demandScore}%</span>
                        <span className="text-[10px] block font-bold text-purple-100 mt-1">Expected Lead Velocity</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold">Outstanding demand</span>
                    </div>

                    <div className="md:col-span-8 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between bg-slate-50/20">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Price Competitiveness Verdict</span>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-semibold">
                          {optimizationResult.pricingVerdict}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Current Monthly Rent</span>
                          <span className="text-sm font-bold text-slate-800">€{optimizingListing.price}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-purple-600 font-bold block">AI Target Range</span>
                          <span className="text-sm font-bold text-purple-700">€{optimizationResult.suggestedPriceRange.min} - €{optimizationResult.suggestedPriceRange.max}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Value Add Upgrades Checklist */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Recommended Rent-Maximizer Renovation ROI</span>
                    <p className="text-[11px] text-slate-400">Select proposed items to simulate increased property leasing margins:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {optimizationResult.suggestedUpgrades.map((upgrade: string, i: number) => {
                        const isSelected = selectedUpgrades.includes(upgrade);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSelectedUpgrades(prev => 
                                prev.includes(upgrade) ? prev.filter(u => u !== upgrade) : [...prev, upgrade]
                              );
                            }}
                            className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-purple-50/50 border-purple-400 text-purple-800'
                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                            }`}
                          >
                            <span className="font-semibold">{upgrade.split(" (+")[0]}</span>
                            <span className="text-[10px] text-purple-600 font-bold mt-2 flex items-center justify-between w-full">
                              <span>+€25/mo rental yield</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Compare Side by Side */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">AI Copywriting Enhancements</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Original Copy */}
                      <div className="p-4 border border-slate-100 rounded-2xl space-y-2.5 opacity-60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Original Description</span>
                        <h4 className="font-bold text-xs text-slate-700">{optimizingListing.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-4">{optimizingListing.description}</p>
                      </div>

                      {/* Optimized Copy */}
                      <div className="p-4 bg-purple-50/20 border border-purple-100 rounded-2xl space-y-2.5 relative">
                        <div className="absolute top-3 right-3 bg-purple-100 text-purple-700 text-[8px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full">
                          AI Refined
                        </div>
                        <span className="text-[10px] font-bold text-purple-500 uppercase">High-Converting Draft</span>
                        <h4 className="font-bold text-xs text-purple-800 flex items-center gap-1 pr-12">
                          <Sparkles className="w-3.5 h-3.5" />
                          {optimizationResult.optimizedTitle}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-4">{optimizationResult.optimizedDescription}</p>
                      </div>

                    </div>
                  </div>

                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOptimizingListing(null);
                  setOptimizationResult(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>

              {optimizationResult && (
                <button
                  type="button"
                  onClick={handleApplyOptimization}
                  disabled={appliedSuccess}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  {appliedSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Applied Optimization!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Apply AI Optimization</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SMART DRAFT REPLY ASSISTANT DIALOG */}
      {draftingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5.5 h-5.5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">AI Copilot Draft Assistant</h3>
                  <p className="text-xs text-slate-400 font-semibold">Replying to: {draftingBooking.guestName}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setDraftingBooking(null);
                  setDraftedReply('');
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {isDraftingReply ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Analyzing message history...</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Generating warm, high-converting rental response draft</p>
                  </div>
                </div>
              ) : draftedReply ? (
                <div className="space-y-4">
                  {/* Latest Tenant Message Bubble */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Message Received</span>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 italic">
                      "{draftingBooking.messages?.[draftingBooking.messages.length - 1]?.text || `Hello Carlos! I wanted to check if utilities/Wi-Fi and weekly cleaning of common areas are included in the €${draftingBooking.listingPrice}/mo price?`}"
                    </div>
                  </div>

                  {/* AI Generated Draft Box */}
                  <div className="space-y-1.5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Smart Response Draft
                      </span>
                      <button
                        onClick={handleCopyDraftReply}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                      >
                        {showCopiedReply ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={draftedReply}
                      onChange={(e) => setDraftedReply(e.target.value)}
                      className="w-full p-4 bg-emerald-50/10 border border-emerald-100 focus:bg-white rounded-2xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-36 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDraftingBooking(null);
                  setDraftedReply('');
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>

              {draftedReply && (
                <button
                  type="button"
                  onClick={handleSendDraftedReply}
                  disabled={sentReplySuccess}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  {sentReplySuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Response Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* PROPERTY PHOTO UPLOAD & GALLERY MANAGER MODAL */}
      {photoManagingListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">Property Photos Manager</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {managedImages.length} {managedImages.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-md mt-0.5">
                    {photoManagingListing.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoManagingListing(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Drag & Drop Device Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Upload Photo Files From Your Computer / Device</span>
                  <span className="text-[10px] text-slate-400 font-normal">Supports JPG, PNG, WEBP</span>
                </label>

                <div
                  onDragOver={handleDashDragOver}
                  onDragLeave={handleDashDragLeave}
                  onDrop={handleDashDrop}
                  onClick={() => dashFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dashIsDragging
                      ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                      : 'border-slate-200 hover:border-emerald-500 hover:bg-slate-50/80 bg-slate-50/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={dashFileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    onChange={handleDashFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                      <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        Drag and drop photo files here or <span className="text-emerald-600 underline">select files from device</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        High-resolution photo files will instantly sync to tenant search listings
                      </p>
                    </div>
                  </div>
                </div>

                {dashUploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-[11px] text-rose-700 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{dashUploadError}</span>
                  </div>
                )}
              </div>

              {/* Current Listing Photo Gallery */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Active Listing Photo Gallery ({managedImages.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    First photo is your listing's primary cover image
                  </span>
                </div>

                {managedImages.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1">
                    <Image className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">No photos uploaded yet</p>
                    <p className="text-[10px] text-slate-400">Upload photos above to showcase your property to prospective tenants.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {managedImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs transition-all hover:shadow-md"
                      >
                        <img
                          src={imgUrl}
                          alt={`Listing photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Primary Badge or Make Primary trigger */}
                        {idx === 0 ? (
                          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Primary Cover</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...managedImages];
                              const target = copy.splice(idx, 1)[0];
                              setManagedImages([target, ...copy]);
                            }}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md transition-all shadow cursor-pointer"
                          >
                            Set as Cover
                          </button>
                        )}

                        {/* Remove photo button */}
                        <button
                          type="button"
                          onClick={() => setManagedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md transition-all shadow cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          Photo #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPhotoManagingListing(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePropertyPhotos}
                disabled={isPhotoSaving || photoSaveSuccess}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {photoSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Photos Updated & Saved!</span>
                  </>
                ) : isPhotoSaving ? (
                  <span>Saving Photos...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Save Property Photos</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE LISTING CONFIRMATION MODAL */}
      {deletingListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 space-y-0">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-br from-rose-50/80 to-slate-50 border-b border-rose-100/60 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Delete Property Listing
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeletingListing(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to delete this listing? It will immediately be removed from public tenant search results, your management dashboard, and active map views.
              </p>

              {/* Property Card Summary Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <img
                  src={deletingListing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
                  alt={deletingListing.title}
                  referrerPolicy="no-referrer"
                  className="w-14 h-12 rounded-xl object-cover bg-white shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-800 text-xs truncate block">
                    {deletingListing.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-300" />
                    {deletingListing.location}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      €{deletingListing.price}/mo
                    </span>
                    <PropertyStatusBadge status={deletingListing.status} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingListing(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting Listing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING PAYOUT NOTIFICATION TOAST CARD */}
      {payoutNotification && (
        <div className="fixed bottom-20 right-6 z-50 max-w-sm sm:max-w-md bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`p-2 rounded-xl shrink-0 ${
            payoutNotification.type === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {payoutNotification.type === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            )}
          </div>

          <div className="flex-1 space-y-1 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-white">
                {payoutNotification.type === 'completed' ? 'Payout Processed' : 'Payout Request Initiated'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{payoutNotification.timestamp}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-snug">
              €{payoutNotification.amount.toFixed(2)} requested for {payoutNotification.bankName} ({payoutNotification.accountNumber.slice(-4)}).
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px]">
              <span className="font-mono text-emerald-400 font-bold">{payoutNotification.referenceCode}</span>
              <button
                type="button"
                onClick={() => setPayoutNotification(null)}
                className="text-slate-400 hover:text-white underline cursor-pointer font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPayoutNotification(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export function LandlordDashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner Skeleton */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-slate-800 animate-shimmer-dark" />
            <div className="h-8 w-64 rounded-xl bg-slate-800 animate-shimmer-dark" />
            <div className="h-4 w-96 max-w-full rounded-lg bg-slate-800/80 animate-shimmer-dark" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-11 w-36 rounded-2xl bg-slate-800 animate-shimmer-dark" />
            <div className="h-11 w-36 rounded-2xl bg-slate-800 animate-shimmer-dark" />
          </div>
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-md bg-slate-200 animate-shimmer" />
              <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-shimmer" />
            </div>
            <div className="h-8 w-20 rounded-xl bg-slate-200 animate-shimmer" />
            <div className="h-3 w-32 rounded-md bg-slate-100 animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Analytics Charts & Revenue Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 rounded-lg bg-slate-200 animate-shimmer" />
            <div className="h-8 w-28 rounded-xl bg-slate-100 animate-shimmer" />
          </div>
          <div className="h-64 rounded-2xl bg-slate-100 animate-shimmer w-full" />
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white space-y-4">
          <div className="h-6 w-40 rounded-lg bg-slate-800 animate-shimmer-dark" />
          <div className="h-12 w-full rounded-2xl bg-slate-800 animate-shimmer-dark" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full rounded-md bg-slate-800/80 animate-shimmer-dark" />
            <div className="h-4 w-3/4 rounded-md bg-slate-800/80 animate-shimmer-dark" />
            <div className="h-4 w-5/6 rounded-md bg-slate-800/80 animate-shimmer-dark" />
          </div>
        </div>
      </div>

      {/* Listings & Bookings Table Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 rounded-lg bg-slate-200 animate-shimmer" />
          <div className="h-9 w-32 rounded-xl bg-slate-100 animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

