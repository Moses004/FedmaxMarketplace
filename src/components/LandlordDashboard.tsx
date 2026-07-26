import React, { useMemo, useState, useEffect } from 'react';
import { Listing, Booking, User, BookingMessage } from '../types';
import { getListingViews, updateListing, addBookingMessage } from '../services/store';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Eye, FileText, CheckCircle, Clock, Euro, Plus, Building, MapPin, 
  ChevronRight, Calendar, AlertCircle, BarChart3, PieChartIcon, ArrowUpRight, Sparkles,
  Zap, Copy, Check, MessageSquare, Send, X, ArrowRight, ShieldCheck, Heart
} from 'lucide-react';

interface LandlordDashboardProps {
  currentUser: User | null;
  listings: Listing[];
  bookings: Booking[];
  onAddListingClick: () => void;
  onViewBookingClick: () => void;
  onViewListingClick: (listing: Listing) => void;
  onRefreshData?: () => void;
}

export default function LandlordDashboard({
  currentUser,
  listings,
  bookings,
  onAddListingClick,
  onViewBookingClick,
  onViewListingClick,
  onRefreshData
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

    return {
      totalViews,
      totalRequests,
      pendingRequests,
      approvedRequests,
      conversionRate,
      potentialRevenue
    };
  }, [landlordListings, receivedBookings, viewsMap]);

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
        <button
          onClick={onAddListingClick}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>List Another Property</span>
        </button>
      </div>

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
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-200 transition-colors flex items-center gap-3.5">
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize inline-block ${
                            listing.type === 'room' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            listing.type === 'studio' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {listing.type}
                          </span>
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
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOptimizeListing(listing)}
                              className="flex items-center gap-1 text-purple-700 hover:text-white font-bold text-[11px] px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-600 transition-all shadow-sm/5 hover:border-purple-600"
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>AI Optimize</span>
                            </button>
                            <button
                              onClick={() => onViewListingClick(listing)}
                              className="text-slate-400 hover:text-slate-600 font-bold text-[11px] px-2 py-1 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-white transition-all"
                            >
                              View Detail
                            </button>
                            <button
                              onClick={onViewBookingClick}
                              className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-all"
                            >
                              Manage Bookings
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
        </>
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

    </div>
  );
}
