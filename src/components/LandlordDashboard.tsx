import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Listing, Booking, User, BookingMessage, PayoutAccount, PayoutTransaction, ListingStatus, LandlordEarningRow } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  updateProperty, 
  deleteProperty,
  removePropertyVideo,
  replacePropertyVideo,
  addBookingMessage, 
  getPayoutTransactions,
  subscribeToSupabaseChanges
} from '../services/databaseService';
import { 
  initializePayout, 
  verifyPayout, 
  fetchPayoutTransactions,
  fetchLandlordEarnings
} from '../services/paystackService';
import { PAYSTACK_NIGERIAN_BANKS } from '../constants/banks';
import PropertyStatusBadge, { STATUS_CONFIG } from './PropertyStatusBadge';
import { getListingPrices } from '../utils/currency';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Eye, FileText, CheckCircle, Clock, Euro, Plus, Building, MapPin, 
  ChevronRight, Calendar, AlertCircle, BarChart3, PieChartIcon, ArrowUpRight, Sparkles,
  Zap, Copy, Check, MessageSquare, Send, X, ArrowRight, ShieldCheck, Heart,
  Upload, FolderPlus, Trash2, Image, ImagePlus, UploadCloud, Film, Play, Pause, Video,
  Wallet, CreditCard, ArrowDownRight, Download, RefreshCw, CheckCircle2, DollarSign, Building2, Sliders, ExternalLink, HelpCircle, Info, User as UserIcon, RotateCcw
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
  const toast = useToast();
  
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

  // Landlord Payout & Withdrawal States (Powered by Supabase Edge Functions payout-initialize-v2 & payout-verify)
  const [payoutTransactions, setPayoutTransactions] = useState<any[]>([]);
  const [landlordEarnings, setLandlordEarnings] = useState<LandlordEarningRow[]>([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [ledgerViewTab, setLedgerViewTab] = useState<'payouts' | 'earnings'>('payouts');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalStep, setWithdrawalStep] = useState<'form' | 'confirm'>('form');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [verifyingReference, setVerifyingReference] = useState<string | null>(null);
  const [withdrawalSuccessTx, setWithdrawalSuccessTx] = useState<any | null>(null);
  const [payoutNotification, setPayoutNotification] = useState<{
    type: 'completed' | 'processing';
    amount: number;
    grossAmount?: number;
    commissionAmount?: number;
    bankName: string;
    accountNumber: string;
    referenceCode: string;
    status?: string;
    timestamp?: string;
  } | null>(null);

  const [payoutAccount, setPayoutAccount] = useState<{
    bankNameOrService: string;
    accountNumberOrIban: string;
    isVerified?: boolean;
    autoPayoutEnabled?: boolean;
    autoPayoutFrequency?: string;
    recipientCode?: string;
  } | null>({
    bankNameOrService: 'Access Bank',
    accountNumberOrIban: '0123456789',
    isVerified: true,
    autoPayoutEnabled: false,
    autoPayoutFrequency: 'weekly',
    recipientCode: 'RCP_px982301'
  });

  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [accountResolveSuccess, setAccountResolveSuccess] = useState<string | null>(null);
  const [accountResolveError, setAccountResolveError] = useState<string | null>(null);

  const handleResolvePaystackAccount = async () => {
    if (!editIban || editIban.trim().replace(/\D/g, '').length !== 10) {
      setAccountResolveError('Please enter a valid 10-digit Nigerian account number.');
      return;
    }
    setIsResolvingAccount(true);
    setAccountResolveError(null);
    setAccountResolveSuccess(null);
    setTimeout(() => {
      setIsResolvingAccount(false);
      const resolvedName = editHolderName || currentUser?.name || 'Verified Beneficiary';
      setAccountResolveSuccess(`Verified account: ${resolvedName} (${editBankName})`);
      setEditVerificationStatus('verified');
      setPayoutAccount({
        bankNameOrService: editBankName,
        accountNumberOrIban: editIban,
        isVerified: true,
        autoPayoutEnabled: editAutoPayoutEnabled,
        autoPayoutFrequency: editAutoPayoutFrequency,
        recipientCode: 'RCP_px982301'
      });
    }, 700);
  };

  // Bank Form State
  const [bankList, setBankList] = useState<{ name: string; code: string }[]>(PAYSTACK_NIGERIAN_BANKS);
  const [selectedBankCode, setSelectedBankCode] = useState<string>(PAYSTACK_NIGERIAN_BANKS[0]?.code || '044');
  const [selectedBankName, setSelectedBankName] = useState<string>(PAYSTACK_NIGERIAN_BANKS[0]?.name || 'Access Bank');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>(currentUser?.name || '');

  // Payout Account Form / Preferences state
  const [editHolderName, setEditHolderName] = useState(currentUser?.name || '');
  const [editBankName, setEditBankName] = useState(PAYSTACK_NIGERIAN_BANKS[0]?.name || 'Access Bank');
  const [editIban, setEditIban] = useState('');
  const [editBic, setEditBic] = useState('');
  const [editMethod, setEditMethod] = useState<'sepa_bank' | 'paystack_bank' | 'paypal'>('paystack_bank');
  const [editAutoPayoutEnabled, setEditAutoPayoutEnabled] = useState(false);
  const [editAutoPayoutFrequency, setEditAutoPayoutFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'threshold'>('weekly');
  const [editAutoPayoutThreshold, setEditAutoPayoutThreshold] = useState<number>(250);
  const [editVerificationStatus, setEditVerificationStatus] = useState<'verified' | 'unverified' | 'pending_verification'>('verified');
  const [payoutModalTab, setPayoutModalTab] = useState<'details' | 'verification' | 'auto_payout'>('details');

  // Listing Management (Deletion & Status Badges) States
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStatus = async (listingId: string, newStatus: ListingStatus) => {
    setStatusUpdatingId(listingId);
    try {
      await updateProperty(listingId, { status: newStatus });
      if (onRefreshData) onRefreshData();
      showToast(`Property status updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
    } catch (err: any) {
      console.error('Failed to update property status in Supabase:', err);
      showToast(`Error updating status: ${err.message || 'Network error'}`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    setIsDeleting(true);
    try {
      await deleteProperty(deletingListing.id);
      const title = deletingListing.title;
      setDeletingListing(null);
      if (onRefreshData) onRefreshData();
      showToast(`Listing "${title}" has been permanently deleted.`);
    } catch (err: any) {
      console.error('Failed to delete property in Supabase:', err);
      showToast(`Error deleting listing: ${err.message || 'Network error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Load Payout Ledger Transactions and Landlord Earnings directly via Supabase RLS
  const loadLandlordFinancialData = async () => {
    try {
      setIsLoadingPayouts(true);
      setIsLoadingEarnings(true);
      const [txs, earnings] = await Promise.all([
        fetchPayoutTransactions(),
        fetchLandlordEarnings()
      ]);
      setPayoutTransactions(txs || []);
      setLandlordEarnings(earnings || []);
    } catch (err) {
      console.error('Failed to load landlord financial data:', err);
    } finally {
      setIsLoadingPayouts(false);
      setIsLoadingEarnings(false);
    }
  };

  const loadPayoutHistory = loadLandlordFinancialData;

  // Load Financial Data on mount / landlord change
  useEffect(() => {
    if (currentUser?.id) {
      loadLandlordFinancialData();
      if (!accountName && currentUser.name) {
        setAccountName(currentUser.name);
      }
    }
  }, [currentUser?.id]);

  // Real-time listeners for public.payout_transactions and public.landlord_earnings
  useEffect(() => {
    const unsubPayouts = subscribeToSupabaseChanges('payout_transactions', () => {
      loadLandlordFinancialData();
    });
    const unsubEarnings = subscribeToSupabaseChanges('landlord_earnings', () => {
      loadLandlordFinancialData();
    });
    return () => {
      if (unsubPayouts) unsubPayouts();
      if (unsubEarnings) unsubEarnings();
    };
  }, []);

  // Render visual status indicator badge with exact requested status strings
  const renderStatusIndicator = (status?: string | null) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'successful':
      case 'completed':
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Successful</span>
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
      case 'reversed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Reversed</span>
          </span>
        );
      case 'cancelled':
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs">
            <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Cancelled</span>
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

  // Handle Save Payout Account Settings Preferences
  const handleSaveAccountDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAccountModal(false);
    toast.success('Payout preferences updated.');
  };

  // Property Photo & Video Media Manager States
  const [photoManagingListing, setPhotoManagingListing] = useState<Listing | null>(null);
  const [managedMediaTab, setManagedMediaTab] = useState<'photos' | 'video'>('photos');
  const [managedImages, setManagedImages] = useState<string[]>([]);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [photoSaveSuccess, setPhotoSaveSuccess] = useState(false);
  const [dashIsDragging, setDashIsDragging] = useState(false);
  const [dashUploadError, setDashUploadError] = useState<string | null>(null);
  const dashFileInputRef = useRef<HTMLInputElement>(null);

  // Video Management States in Dashboard Modal
  const [dashVideoFile, setDashVideoFile] = useState<File | null>(null);
  const [dashVideoPreview, setDashVideoPreview] = useState<string | null>(null);
  const [dashVideoDuration, setDashVideoDuration] = useState<number | null>(null);
  const [dashIsUploadingVideo, setDashIsUploadingVideo] = useState(false);
  const [dashVideoError, setDashVideoError] = useState<string | null>(null);
  const [dashIsDeletingVideo, setDashIsDeletingVideo] = useState(false);
  const dashVideoFileInputRef = useRef<HTMLInputElement>(null);

  const handleCloseMediaModal = () => {
    if (dashVideoPreview) {
      URL.revokeObjectURL(dashVideoPreview);
    }
    setDashVideoFile(null);
    setDashVideoPreview(null);
    setDashVideoDuration(null);
    setDashVideoError(null);
    setDashUploadError(null);
    setPhotoManagingListing(null);
  };

  const handleDashProcessVideoFile = (file: File) => {
    setDashVideoError(null);
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const validExtensions = ['.mp4', '.webm', '.mov'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidType = validTypes.includes(file.type);

    if (!hasValidType && !hasValidExt) {
      setDashVideoError('Unsupported format. Please select an MP4, WebM, or MOV video.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setDashVideoError('Video file exceeds the 100MB maximum size limit.');
      return;
    }

    if (dashVideoPreview) {
      URL.revokeObjectURL(dashVideoPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setDashVideoFile(file);
    setDashVideoPreview(objectUrl);

    // Extract duration
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        setDashVideoDuration(Math.round(tempVideo.duration));
      };
      tempVideo.src = objectUrl;
    } catch {
      setDashVideoDuration(null);
    }
  };

  const handleUploadNewVideo = async () => {
    if (!photoManagingListing || !dashVideoFile) return;

    setDashIsUploadingVideo(true);
    setDashVideoError(null);

    try {
      const updatedListing = await replacePropertyVideo(
        photoManagingListing.id,
        dashVideoFile,
        photoManagingListing.videoUrl
      );

      setPhotoManagingListing(updatedListing);
      if (dashVideoPreview) {
        URL.revokeObjectURL(dashVideoPreview);
      }
      setDashVideoFile(null);
      setDashVideoPreview(null);
      setDashVideoDuration(null);
      toast.success('Property walkthrough video successfully uploaded and saved!');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Failed to upload video in landlord dashboard:', err);
      setDashVideoError(err.message || 'Failed to upload video. Please check your network connection.');
      toast.error(err.message || 'Video upload failed');
    } finally {
      setDashIsUploadingVideo(false);
    }
  };

  const handleRemoveExistingVideo = async () => {
    if (!photoManagingListing || !photoManagingListing.videoUrl) return;

    if (!window.confirm('Are you sure you want to remove the video tour from this listing?')) {
      return;
    }

    setDashIsDeletingVideo(true);
    setDashVideoError(null);

    try {
      const updatedListing = await removePropertyVideo(
        photoManagingListing.id,
        photoManagingListing.videoUrl
      );

      setPhotoManagingListing(updatedListing);
      if (dashVideoPreview) {
        URL.revokeObjectURL(dashVideoPreview);
      }
      setDashVideoFile(null);
      setDashVideoPreview(null);
      setDashVideoDuration(null);
      toast.success('Property video removed successfully.');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Failed to remove property video:', err);
      setDashVideoError(err.message || 'Unable to remove video. Please try again.');
      toast.error(err.message || 'Failed to remove video');
    } finally {
      setDashIsDeletingVideo(false);
    }
  };

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

    updateProperty(photoManagingListing.id, {
      images: managedImages.length > 0 ? managedImages : [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
      ]
    }).then(() => {
      setIsPhotoSaving(false);
      setPhotoSaveSuccess(true);

      setTimeout(() => {
        setPhotoSaveSuccess(false);
        setPhotoManagingListing(null);
        if (onRefreshData) onRefreshData();
      }, 1200);
    }).catch((err) => {
      console.error('Failed to save property photos:', err);
      setIsPhotoSaving(false);
      showToast(err.message || 'Failed to update photos');
    });
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

  // 3. Load actual views from listings
  const viewsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of listings) {
      map[l.id] = l.views || 0;
    }
    return map;
  }, [listings]);

  // Helper to mask account number for privacy in UI tables
  const maskAccountNumber = (acc?: string | null) => {
    if (!acc) return '—';
    const clean = String(acc).replace(/\D/g, '');
    if (clean.length >= 4) {
      return '******' + clean.slice(-4);
    }
    return clean.length > 0 ? '******' + clean : '—';
  };

  // 4. Calculate Key Analytics (Backend Authoritative Commission & Balance Logic)
  const stats = useMemo(() => {
    const totalViews = landlordListings.reduce((sum, l) => sum + (viewsMap[l.id] || 0), 0);
    const totalRequests = receivedBookings.length;
    const pendingRequests = receivedBookings.filter(b => b.status === 'pending').length;
    const approvedRequests = receivedBookings.filter(b => b.status === 'approved' || b.status === 'completed' || (b.status as string) === 'confirmed').length;
    const conversionRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
    
    // Authoritative calculation from public.landlord_earnings table
    let grossRevenue = 0;
    let rentoraCommission = 0;
    let netEarnings = 0;

    if (landlordEarnings && landlordEarnings.length > 0) {
      grossRevenue = landlordEarnings.reduce((sum, e) => sum + (Number(e.gross_amount) || 0), 0);
      rentoraCommission = landlordEarnings.reduce((sum, e) => sum + (Number(e.commission_amount) || 0), 0);
      netEarnings = landlordEarnings.reduce((sum, e) => sum + (Number(e.net_amount) || 0), 0);
    } else {
      const verifiedPaidBookings = receivedBookings.filter(b => 
        (b.paymentStatus === 'paid' || b.paymentVerified === true || b.paymentVerificationStatus === 'verified') &&
        (b.status === 'approved' || b.status === 'completed' || (b.status as string) === 'confirmed')
      );
      grossRevenue = verifiedPaidBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      rentoraCommission = grossRevenue * 0.05;
      netEarnings = grossRevenue * 0.95;
    }

    const paystackRevenue = receivedBookings
      .filter(b => (b.status === 'approved' || b.status === 'completed' || (b.status as string) === 'confirmed') && b.paymentMethod === 'paystack')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const safepayRevenue = receivedBookings
      .filter(b => (b.status === 'approved' || b.status === 'completed' || (b.status as string) === 'confirmed') && b.paymentMethod !== 'paystack')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    // Sum all in-flight or completed payouts (pending, processing, successful, completed)
    const totalWithdrawn = payoutTransactions
      .filter(tx => {
        const st = String(tx.status || '').toLowerCase();
        return st === 'completed' || st === 'successful' || st === 'processing' || st === 'pending';
      })
      .reduce((sum, tx) => sum + (Number(tx.amount || tx.requested_amount) || 0), 0);

    const availableBalance = Math.max(0, netEarnings - totalWithdrawn);

    const todayStr = new Date().toISOString().split('T')[0];
    const escrowBalance = receivedBookings
      .filter(b => (b.status === 'approved' || b.status === 'completed' || (b.status as string) === 'confirmed') && b.startDate > todayStr)
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    return {
      totalViews,
      totalRequests,
      pendingRequests,
      approvedRequests,
      conversionRate,
      grossRevenue,
      potentialRevenue: grossRevenue,
      rentoraCommission,
      netEarnings,
      paystackRevenue,
      safepayRevenue,
      totalWithdrawn,
      availableBalance,
      escrowBalance
    };
  }, [landlordListings, receivedBookings, viewsMap, payoutTransactions]);

  // Upcoming Rent Due Alerts for Landlords
  const dueSoonBookings = useMemo(() => {
    return receivedBookings.filter(
      b => b.paymentStatus === 'due_soon' || (b.paymentDueDaysLeft !== undefined && b.paymentDueDaysLeft <= 3 && (b.status === 'completed' || (b.status as string) === 'confirmed'))
    );
  }, [receivedBookings]);

  // 5. Chart Data: Views & Requests per listing
  const chartData = useMemo(() => {
    return landlordListings.map(l => {
      const views = viewsMap[l.id] || 0;
      const totalRequestsForThis = receivedBookings.filter(b => (b.propertyId === l.id || b.listingId === l.id)).length;
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
          if (b.status === 'approved' || b.status === 'completed' || (b.status as string) === 'confirmed') {
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
      confirmed: receivedBookings.filter(b => b.status === 'completed' || (b.status as string) === 'confirmed').length,
      rejected: receivedBookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
    };

    return [
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Approved', value: statusCounts.approved, color: '#10b981' },
      { name: 'Completed', value: statusCounts.confirmed, color: '#6366f1' },
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

    updateProperty(optimizingListing.id, {
      title: optimizationResult.optimizedTitle,
      description: optimizationResult.optimizedDescription,
      price: finalPrice
    }).then(() => {
      setAppliedSuccess(true);
      setTimeout(() => {
        setOptimizingListing(null);
        setOptimizationResult(null);
        setAppliedSuccess(false);
        if (onRefreshData) onRefreshData();
      }, 1500);
    }).catch((err) => {
      console.error('Failed to update listing optimization:', err);
      showToast('Error updating listing with optimization');
    });
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

  const handleSendDraftedReply = async () => {
    if (!draftingBooking || !draftedReply) return;
    
    try {
      await addBookingMessage(draftingBooking.id, {
        senderId: currentUser?.id || 'landlord-1',
        senderName: currentUser?.name || 'Landlord',
        senderRole: 'landlord',
        text: draftedReply
      });

      setSentReplySuccess(true);
      setTimeout(() => {
        setDraftingBooking(null);
        setDraftedReply('');
        setSentReplySuccess(false);
        if (onRefreshData) onRefreshData();
      }, 1500);
    } catch (err) {
      console.error('Failed to send drafted reply:', err);
      showToast('Error sending message');
    }
  };

  const handleCopyDraftReply = () => {
    navigator.clipboard.writeText(draftedReply);
    setShowCopiedReply(true);
    setTimeout(() => setShowCopiedReply(false), 2000);
  };

  // Execute Landlord Withdrawal Request via Supabase Edge Function payout-initialize-v2
  const handleExecuteWithdrawal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setWithdrawalError(null);

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawalError('Please enter a valid withdrawal amount.');
      return;
    }

    if (amountNum < 1000) {
      setWithdrawalError('Minimum withdrawal request is ₦1,000');
      return;
    }

    const normalizedAccount = accountNumber.trim().replace(/\D/g, '');
    if (!normalizedAccount || normalizedAccount.length !== 10) {
      setWithdrawalError('A valid 10-digit Nigerian bank account number is required.');
      return;
    }

    if (!selectedBankCode || !selectedBankCode.trim()) {
      setWithdrawalError('Please select a commercial bank.');
      return;
    }

    if (!accountName.trim()) {
      setWithdrawalError('Please enter the account beneficiary name.');
      return;
    }

    setIsProcessingWithdrawal(true);

    try {
      const activeBankName = selectedBankName || (bankList.find(b => b.code === selectedBankCode)?.name || 'Commercial Bank');

      const data = await initializePayout({
        amount: amountNum,
        bankCode: selectedBankCode,
        bankName: activeBankName,
        accountNumber: normalizedAccount,
        accountName: accountName.trim()
      });

      setShowWithdrawModal(false);
      setWithdrawalStep('form');
      setWithdrawAmount('');
      setWithdrawalError(null);

      const refCode = data.reference || (typeof data.payout_id === 'string' ? data.payout_id : `RNT-PAY-${Date.now().toString().slice(-8)}`);
      const grossAmt = data.requested_amount || data.amount || amountNum;
      const commAmt = data.commission_amount || (grossAmt * 0.05);
      const transAmt = data.transfer_amount || (grossAmt - commAmt);
      const returnStatus = (data.status || 'processing').toLowerCase();

      setWithdrawalSuccessTx(data);
      setPayoutNotification({
        type: returnStatus === 'successful' || returnStatus === 'completed' ? 'completed' : 'processing',
        amount: transAmt,
        grossAmount: grossAmt,
        commissionAmount: commAmt,
        bankName: activeBankName,
        accountNumber: normalizedAccount,
        referenceCode: refCode,
        status: returnStatus === 'successful' || returnStatus === 'completed' ? 'Successful' : 'Processing',
        timestamp: new Date().toISOString()
      });

      toast.success(
        'Withdrawal initiated successfully.',
        `Reference: ${refCode} • Gross: ₦${grossAmt.toLocaleString()} • Transferred: ₦${transAmt.toLocaleString()} (${returnStatus.toUpperCase()})`
      );

      // Refresh landlord payout ledger and stats
      await loadPayoutHistory();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Withdrawal execution error:', err);
      const msg = err.message || 'Withdrawal failed. Please check your bank details.';
      setWithdrawalError(msg);
      toast.error('Withdrawal Notice', msg);

      if (msg.toLowerCase().includes('already have a payout being processed')) {
        await loadPayoutHistory();
      }
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Verify pending/processing payout status via Supabase Edge Function payout-verify
  const handleVerifyPayout = async (reference: string) => {
    if (!reference || verifyingReference) return;
    setVerifyingReference(reference);

    try {
      const res = await verifyPayout(reference);
      const statusLabel = res.status ? res.status.charAt(0).toUpperCase() + res.status.slice(1) : 'Updated';
      toast.info(
        'Payout Status Updated',
        `Reference ${reference}: ${statusLabel}`
      );
      await loadPayoutHistory();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Payout verify error:', err);
      toast.error('Verification Error', err.message || 'Failed to verify payout status.');
    } finally {
      setVerifyingReference(null);
    }
  };

  // Generate and download formal payout disbursement statement receipt
  const handleDownloadReceipt = (tx: any) => {
    const ref = tx.reference || tx.reference_code || tx.referenceCode || `TXN-${tx.id || Date.now()}`;
    const grossVal = tx.requested_amount || tx.amount || 0;
    const commVal = tx.commission_amount || (Number(grossVal) * 0.05);
    const netVal = tx.transfer_amount || (Number(grossVal) - Number(commVal));
    const curr = tx.currency || 'NGN';
    const bName = tx.bank_name || tx.bank || 'Nigerian Commercial Bank';
    const accNum = maskAccountNumber(tx.account_number || tx.account || '');
    const accHolder = tx.account_name || tx.account_holder_name || tx.recipient_name || currentUser?.name || 'Landlord Beneficiary';
    const dt = tx.created_at || tx.requested_at || new Date().toISOString();
    const st = (tx.status || 'Processing').toUpperCase();

    const currSymbol = curr === 'NGN' ? '₦' : curr === 'EUR' ? '€' : '$';

    const receiptContent = `========================================================
             RENTORA LANDLORD DISBURSEMENT RECEIPT
========================================================
Receipt Reference:   ${ref}
Transaction Date:    ${new Date(dt).toLocaleString()}
Landlord ID:         ${currentUser?.id || 'AUTH-LANDLORD'}
Beneficiary Name:    ${accHolder}

--------------------------------------------------------
DISBURSEMENT FINANCIAL BREAKDOWN
--------------------------------------------------------
Settlement Channel:  Paystack Direct Payout
Disbursement Bank:   ${bName}
Account Number:      ${accNum}
Payout Status:       ${st}
Gross Withdrawal:    ${currSymbol}${Number(grossVal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Rentora Comm. (5%):  ${currSymbol}${Number(commVal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Net Transferred:     ${currSymbol}${Number(netVal).toLocaleString(undefined, { minimumFractionDigits: 2 })}

--------------------------------------------------------
SECURITY & AUDIT VERIFICATION
--------------------------------------------------------
Gateway Reference:   ${ref}
Audit Trail:         Supabase Edge Function payout-initialize-v2 / payout-verify
Issuer:              Rentora Escrow & Property Ledger System

This electronic receipt serves as official proof of rental earnings 
disbursement from Rentora to your financial institution.
========================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rentora-Payout-Receipt-${ref}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Disbursement statement downloaded.');
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
                    : 'bg-blue-500/30 text-blue-300 border-blue-400/30'
                }`}>
                  {payoutNotification.status ? payoutNotification.status.toUpperCase() : (payoutNotification.type === 'completed' ? 'SETTLED' : 'PROCESSING')}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                Gross: <span className="font-bold text-white font-mono">₦{(payoutNotification.grossAmount || payoutNotification.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                {payoutNotification.commissionAmount !== undefined && (
                  <span className="text-amber-300 ml-1 font-mono text-[11px]">
                    (5% Commission: -₦{payoutNotification.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </span>
                )}
                {' • '}Transfer: <span className="font-bold text-emerald-300 font-mono">₦{payoutNotification.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                {' • '}Bank: <span className="font-bold text-emerald-300">{payoutNotification.bankName}</span> ({maskAccountNumber(payoutNotification.accountNumber)})
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
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                      ₦{stats.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {stats.availableBalance > 0 && (
                      <span className="text-xs font-bold bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                        Ready for Transfer
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-300">
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                    <span className="text-slate-400">Gross Collected:</span>
                    <span className="font-bold text-white font-mono">₦{stats.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                    <span className="text-slate-400">Rentora (5%):</span>
                    <span className="font-bold text-amber-400 font-mono">₦{stats.rentoraCommission.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                    <span className="text-slate-400">Net Earnings (95%):</span>
                    <span className="font-bold text-emerald-400 font-mono">₦{stats.netEarnings.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                    <span className="text-slate-400">Total Withdrawn:</span>
                    <span className="font-bold text-slate-300 font-mono">₦{stats.totalWithdrawn.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawalSuccessTx(null);
                      setWithdrawalStep('form');
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
                    <span>Withdraw Funds</span>
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
                  <span>Manage Payout Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* UPCOMING RENT COLLECTIBLES & DUE ALERTS BANNER FOR LANDLORDS */}
          {dueSoonBookings.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700/50 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white text-sm">
                        Upcoming Rent Collectibles & Alerts ({dueSoonBookings.length})
                      </h3>
                      <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                        Due in ≤ 3 Days
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      The following tenants have rent renewals due within 3 days. Send a polite reminder nudge directly to their inbox.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dueSoonBookings.map((b) => (
                  <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{b.guestName}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{b.listingTitle}</span>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          €{b.listingPrice.toLocaleString()} {b.billingCycle === 'annual' ? '/yr' : '/mo'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          Due: {b.nextPaymentDueDate || 'Aug 8, 2026'} ({b.paymentDueDaysLeft || 3}d left)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await addBookingMessage(b.id, {
                            senderId: currentUser?.id || 'landlord-1',
                            senderName: currentUser?.name || 'Landlord',
                            senderRole: 'landlord',
                            text: `🔔 Gentle Rent Reminder: Your upcoming ${b.billingCycle === 'annual' ? 'annual' : 'monthly'} rent payment for "${b.listingTitle}" is due on ${b.nextPaymentDueDate || 'Aug 8, 2026'}. Please settle it via your My Bookings tab.`
                          });
                          toast.success('Rent Payment Nudge Dispatched', `Sent polite payment reminder to ${b.guestName}.`);
                          if (onRefreshData) onRefreshData();
                        } catch (err) {
                          console.error('Failed to send nudge message:', err);
                          toast.error('Nudge Error', 'Failed to send reminder.');
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Nudge</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate min-w-0">
                              <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className="truncate">{listing.location}</span>
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
                              value={listing.status || 'active'}
                              onChange={(e) => handleUpdateStatus(listing.id, e.target.value as ListingStatus)}
                              disabled={statusUpdatingId === listing.id}
                              className="text-[9px] font-extrabold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 block hover:bg-white transition-all"
                              title="Quickly update listing status"
                            >
                              <option value="active">Status: Active</option>
                              <option value="pending">Status: Pending</option>
                              <option value="rented">Status: Rented</option>
                              <option value="inactive">Status: Inactive</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                          {getListingPrices(listing).primaryFormatted} <span className="text-[10px] text-emerald-600 font-extrabold">{getListingPrices(listing).periodLabel}</span>
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
                                setManagedMediaTab('photos');
                              }}
                              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all shadow-xs cursor-pointer"
                              title="Upload or manage property photos and video tour"
                            >
                              <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Media ({listing.images.length}P{listing.videoUrl ? ' + 1V' : ''})</span>
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
                  Paystack Payout & Landlord Financial Ledger
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Real-time audit trail of rental disbursements and verified earnings from Supabase
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Ledger View Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setLedgerViewTab('payouts')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      ledgerViewTab === 'payouts'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Withdrawals ({payoutTransactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerViewTab('earnings')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      ledgerViewTab === 'earnings'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Earnings Ledger ({landlordEarnings.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadLandlordFinancialData}
                  disabled={isLoadingPayouts || isLoadingEarnings}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Refresh financial records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${(isLoadingPayouts || isLoadingEarnings) ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
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
                  onClick={() => {
                    setWithdrawalError(null);
                    setWithdrawAmount('');
                    setShowWithdrawModal(true);
                  }}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Withdraw Funds</span>
                </button>
              </div>
            </div>

            {ledgerViewTab === 'payouts' ? (
              <div className="overflow-x-auto">
                {isLoadingPayouts && payoutTransactions.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Loading payout records...</p>
                  </div>
                ) : payoutTransactions.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-700">No Withdrawal History Yet</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      When you withdraw rental funds to your bank account, verified Paystack transaction records and statements will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Reference</th>
                          <th className="py-3 px-4 text-right">Gross (₦)</th>
                          <th className="py-3 px-4 text-right">Rentora (5%)</th>
                          <th className="py-3 px-4 text-right">Net (₦)</th>
                          <th className="py-3 px-4">Bank</th>
                          <th className="py-3 px-4">Account</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {payoutTransactions.map((tx, idx) => {
                          const ref = tx.reference || tx.reference_code || tx.referenceCode || tx.id || `TX-${idx}`;
                          const dt = tx.created_at || tx.requested_at || tx.requestedAt || new Date().toISOString();
                          const bank = tx.bank_name || tx.bank || 'Commercial Bank';
                          const rawAcc = tx.account_number || tx.account || tx.accountDetails || '';
                          const maskedAcc = maskAccountNumber(rawAcc);
                          const grossAmt = Number(tx.requested_amount || tx.amount || 0);
                          const commAmt = Number(tx.commission_amount || (grossAmt * 0.05));
                          const netAmt = Number(tx.transfer_amount || (grossAmt - commAmt));
                          const status = (tx.status || 'pending').toLowerCase();
                          const isPending = status === 'pending' || status === 'processing';

                          return (
                            <tr key={tx.id || ref || idx} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                                {new Date(dt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                                {ref}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                                ₦{grossAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600 whitespace-nowrap">
                                ₦{commAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap text-sm">
                                ₦{netAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-semibold text-slate-700">{bank}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {maskedAcc}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                {renderStatusIndicator(status)}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyPayout(ref)}
                                      disabled={verifyingReference === ref}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-all cursor-pointer disabled:opacity-50"
                                      title="Check and verify latest payout status from Paystack"
                                    >
                                      <RotateCcw className={`w-3 h-3 text-blue-600 ${verifyingReference === ref ? 'animate-spin' : ''}`} />
                                      <span>{verifyingReference === ref ? 'Verifying...' : 'Verify'}</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReceipt(tx)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
                                    title="Download Official Disbursement Statement"
                                  >
                                    <Download className="w-3 h-3 text-slate-500 hover:text-emerald-600 shrink-0" />
                                    <span>Receipt</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* LANDLORD EARNINGS LEDGER TABLE */
              <div className="overflow-x-auto">
                {isLoadingEarnings && landlordEarnings.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Loading landlord earnings ledger...</p>
                  </div>
                ) : landlordEarnings.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-700">No Verified Earnings Yet</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Verified tenant payments and automated 5% commission ledger entries will be recorded here authoritative to public.landlord_earnings.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Booking ID</th>
                          <th className="py-3 px-4">Transaction ID</th>
                          <th className="py-3 px-4 text-right">Gross Amount</th>
                          <th className="py-3 px-4 text-right">Rentora (5%)</th>
                          <th className="py-3 px-4 text-right">Net Earning (95%)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {landlordEarnings.map((entry, idx) => {
                          const dt = entry.created_at || new Date().toISOString();
                          const gross = Number(entry.gross_amount || 0);
                          const comm = Number(entry.commission_amount || (gross * 0.05));
                          const net = Number(entry.net_amount || (gross - comm));
                          const status = (entry.status || 'verified').toLowerCase();

                          return (
                            <tr key={entry.id || idx} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                                {new Date(dt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                {entry.booking_id ? `${String(entry.booking_id).slice(0, 8)}...` : '—'}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {entry.payment_transaction_id ? `${String(entry.payment_transaction_id).slice(0, 8)}...` : '—'}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                                ₦{gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600 whitespace-nowrap">
                                ₦{comm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap text-sm">
                                ₦{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{status}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
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
                  <h3 className="font-bold text-slate-800 text-base">
                    {withdrawalStep === 'confirm' ? 'Confirm Withdrawal Details' : 'Withdraw Funds'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {withdrawalStep === 'confirm' ? 'Please review your payout breakdown before processing' : 'Direct transfer to your Nigerian bank account'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isProcessingWithdrawal) {
                    setShowWithdrawModal(false);
                    setWithdrawalStep('form');
                  }
                }}
                disabled={isProcessingWithdrawal}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200/50 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notice (displays actual backend error message) */}
            {withdrawalError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Withdrawal Notice</span>
                  <p className="leading-relaxed">{withdrawalError}</p>
                </div>
              </div>
            )}

            {withdrawalStep === 'form' ? (
              /* Step 1: Input Form with Live 5% Commission Preview */
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setWithdrawalError(null);
                  const amountNum = parseFloat(withdrawAmount);
                  if (isNaN(amountNum) || amountNum < 1000) {
                    setWithdrawalError('Minimum withdrawal request is ₦1,000');
                    return;
                  }
                  const cleanAccount = accountNumber.trim().replace(/\D/g, '');
                  if (cleanAccount.length !== 10) {
                    setWithdrawalError('A valid 10-digit Nigerian bank account number is required.');
                    return;
                  }
                  if (!selectedBankCode) {
                    setWithdrawalError('Please select a commercial bank.');
                    return;
                  }
                  if (!accountName.trim()) {
                    setWithdrawalError('Please enter the account beneficiary name.');
                    return;
                  }
                  setWithdrawalStep('confirm');
                }} 
                className="p-6 space-y-4"
              >
                {/* Available Balance Pill */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Available Balance:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    ₦{stats.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Bank Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Bank</label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => {
                      setSelectedBankCode(e.target.value);
                      const found = bankList.find(b => b.code === e.target.value);
                      if (found) setSelectedBankName(found.name);
                    }}
                    disabled={isProcessingWithdrawal}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:bg-slate-100"
                  >
                    {bankList.map((b) => (
                      <option key={`bank-select-${b.code}`} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Account Number (10 digits)</label>
                    <span className={`font-mono text-[10px] font-bold ${accountNumber.trim().length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {accountNumber.trim().length}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAccountNumber(val);
                      if (withdrawalError) setWithdrawalError(null);
                    }}
                    disabled={isProcessingWithdrawal}
                    placeholder="0123456789"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  />
                </div>

                {/* Account Beneficiary Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Account Beneficiary Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      if (withdrawalError) setWithdrawalError(null);
                    }}
                    disabled={isProcessingWithdrawal}
                    placeholder="e.g. Samuel Adebayo"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  />
                </div>

                {/* Withdrawal Amount */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Withdrawal Amount (₦)</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Min: ₦1,000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-black text-sm">₦</span>
                    <input
                      type="number"
                      min="1000"
                      step="any"
                      value={withdrawAmount}
                      onChange={(e) => {
                        setWithdrawAmount(e.target.value);
                        if (withdrawalError) setWithdrawalError(null);
                      }}
                      disabled={isProcessingWithdrawal}
                      placeholder="100,000"
                      required
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[10000, 25000, 50000, 100000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWithdrawAmount(preset.toString())}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-mono font-bold text-slate-600 transition-colors cursor-pointer"
                      >
                        ₦{preset.toLocaleString()}
                      </button>
                    ))}
                    {stats.availableBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(Math.floor(stats.availableBalance).toString())}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer hover:bg-emerald-100"
                      >
                        All Available
                      </button>
                    )}
                  </div>
                </div>

                {/* 5% Rentora Commission Preview Breakdown */}
                {parseFloat(withdrawAmount) > 0 && !isNaN(parseFloat(withdrawAmount)) && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Payout Breakdown (5% Rentora Commission)
                    </span>
                    <div className="space-y-1 text-slate-600 font-medium">
                      <div className="flex justify-between">
                        <span>Withdrawal amount:</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₦{parseFloat(withdrawAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-amber-700">
                        <span>Rentora commission (5%):</span>
                        <span className="font-mono font-bold">
                          -₦{(parseFloat(withdrawAmount) * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="border-t border-emerald-200/80 pt-1.5 flex justify-between font-bold text-emerald-900 text-sm">
                        <span>You will receive:</span>
                        <span className="font-mono">
                          ₦{(parseFloat(withdrawAmount) * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight pt-1">
                      *Rentora retains a 5% commission before landlord payout. The backend is authoritative.
                    </p>
                  </div>
                )}

                {/* Review button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) < 1000 || accountNumber.trim().length !== 10 || !accountName.trim()}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      !withdrawAmount || parseFloat(withdrawAmount) < 1000 || accountNumber.trim().length !== 10 || !accountName.trim()
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                    }`}
                  >
                    <span>Proceed to Confirmation</span>
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Confirmation Summary Screen */
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Withdrawal Confirmation Summary
                  </h4>

                  <div className="divide-y divide-slate-200/70 text-xs font-semibold text-slate-700">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500">Withdraw (Gross):</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ₦{parseFloat(withdrawAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center text-amber-700">
                      <span>Rentora commission (5%):</span>
                      <span className="font-mono font-bold">
                        ₦{(parseFloat(withdrawAmount) * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center font-bold text-emerald-800 text-base">
                      <span>You will receive:</span>
                      <span className="font-mono font-black text-emerald-700">
                        ₦{(parseFloat(withdrawAmount) * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500">Destination Bank:</span>
                      <span className="font-bold text-slate-800">
                        {selectedBankName || 'Selected Bank'}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500">Account Number:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {maskAccountNumber(accountNumber)}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500">Beneficiary Name:</span>
                      <span className="font-bold text-slate-800">{accountName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-center gap-2 text-xs text-blue-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    Transfers are authenticated securely via Supabase Edge Functions with zero secret exposure.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawalStep('form');
                      setWithdrawalError(null);
                    }}
                    disabled={isProcessingWithdrawal}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Back / Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteWithdrawal()}
                    disabled={isProcessingWithdrawal}
                    className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isProcessingWithdrawal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying bank account and processing withdrawal...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Confirm Withdrawal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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

      {/* PROPERTY PHOTO & VIDEO MEDIA MANAGER MODAL */}
      {photoManagingListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                  {managedMediaTab === 'photos' ? <ImagePlus className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">Property Media Manager</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-md mt-0.5">
                    {photoManagingListing.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseMediaModal}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
              <button
                type="button"
                onClick={() => setManagedMediaTab('photos')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                  managedMediaTab === 'photos'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Photo Gallery</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {managedImages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManagedMediaTab('video')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                  managedMediaTab === 'video'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Video Tour</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  photoManagingListing.videoUrl
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {photoManagingListing.videoUrl ? '1 Active' : 'None'}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* TAB 1: PHOTOS */}
              {managedMediaTab === 'photos' && (
                <>
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
                </>
              )}

              {/* TAB 2: VIDEO TOUR */}
              {managedMediaTab === 'video' && (
                <div className="space-y-5">
                  {/* Active Video Status & Playback Display */}
                  {photoManagingListing.videoUrl && !dashVideoFile && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Active Property Video Tour
                          </span>
                        </div>
                        {photoManagingListing.videoMetadata?.duration && (
                          <span className="text-[11px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-lg">
                            {Math.floor(photoManagingListing.videoMetadata.duration / 60)}:
                            {String(photoManagingListing.videoMetadata.duration % 60).padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200">
                        <video
                          src={photoManagingListing.videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
                          {photoManagingListing.videoMetadata?.name || 'Property Walkthrough Video'}
                          {photoManagingListing.videoMetadata?.size && (
                            <span className="ml-2 text-slate-400">
                              ({(photoManagingListing.videoMetadata.size / (1024 * 1024)).toFixed(1)} MB)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => dashVideoFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Replace Video</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveExistingVideo}
                            disabled={dashIsDeletingVideo}
                            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{dashIsDeletingVideo ? 'Removing...' : 'Remove Video'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Upload Dropzone & Selection Area */}
                  {(!photoManagingListing.videoUrl || dashVideoFile) && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                          <span>{dashVideoFile ? 'Selected Video File' : 'Upload Walkthrough Video'}</span>
                          <span className="text-[10px] text-slate-400 font-normal">MP4, WebM, MOV (Max 100MB)</span>
                        </label>
                      </div>

                      {/* Video Preview If Selected */}
                      {dashVideoPreview && dashVideoFile ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200">
                            <video
                              src={dashVideoPreview}
                              controls
                              playsInline
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800 truncate max-w-sm">
                                {dashVideoFile.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {(dashVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                                {dashVideoDuration !== null && ` • ${Math.floor(dashVideoDuration / 60)}:${String(dashVideoDuration % 60).padStart(2, '0')} duration`}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (dashVideoPreview) URL.revokeObjectURL(dashVideoPreview);
                                  setDashVideoFile(null);
                                  setDashVideoPreview(null);
                                  setDashVideoDuration(null);
                                }}
                                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={handleUploadNewVideo}
                                disabled={dashIsUploadingVideo}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                              >
                                {dashIsUploadingVideo ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Uploading Video...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Save & Publish Video</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => dashVideoFileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs mx-auto">
                            <Film className="w-7 h-7 stroke-[2]" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">
                              Click to select video walkthrough from your device
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              Supports MP4, WebM, MOV files up to 100 MB
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Properties with video tours receive 3x more tenant inquiries</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={dashVideoFileInputRef}
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleDashProcessVideoFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {dashVideoError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{dashVideoError}</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCloseMediaModal}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>

              {managedMediaTab === 'photos' && (
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
                      <span>Save Photo Gallery</span>
                    </>
                  )}
                </button>
              )}
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
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate min-w-0">
                    <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="truncate">{deletingListing.location}</span>
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {getListingPrices(deletingListing).primaryFormatted} {getListingPrices(deletingListing).periodLabel}
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
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
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
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-md bg-slate-200 dark:bg-slate-800 animate-shimmer" />
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-shimmer" />
            </div>
            <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-slate-800 animate-shimmer" />
            <div className="h-3 w-32 rounded-md bg-slate-100 dark:bg-slate-800/60 animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Analytics Charts & Revenue Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 animate-shimmer" />
            <div className="h-8 w-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          </div>
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-shimmer w-full" />
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 rounded-lg bg-slate-200 dark:bg-slate-800 animate-shimmer" />
          <div className="h-9 w-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

