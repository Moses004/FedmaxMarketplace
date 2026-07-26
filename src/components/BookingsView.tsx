import React, { useState } from 'react';
import { Booking, User, Listing, BookingMessage } from '../types';
import { getBookings, updateBookingStatus, getListings, addBookingMessage, confirmBookingPayment } from '../services/store';
import { 
  Check, X, Calendar, User as UserIcon, Mail, Euro, 
  Clock, CheckCircle, XCircle, ArrowRight, Building, Sparkles,
  MessageSquare, Send, CreditCard, Shield, FileText, Check as CheckIcon, RefreshCw, Download
} from 'lucide-react';

interface BookingsViewProps {
  currentUser: User | null;
  onStatusChanged: () => void;
}

export default function BookingsView({ currentUser, onStatusChanged }: BookingsViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Expanded chat states
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessageText, setChatMessageText] = useState<{ [key: string]: string }>({});
  const [isSendingMessage, setIsSendingMessage] = useState<string | null>(null);

  // Interactive Payment Checkout / Lease states
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [leaseSignName, setLeaseSignName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Send message with Gemini-powered agent replies
  const handleSendChatMessage = async (bookingId: string) => {
    const text = chatMessageText[bookingId]?.trim();
    if (!text) return;

    // Clear input
    setChatMessageText(prev => ({ ...prev, [bookingId]: '' }));
    setIsSendingMessage(bookingId);

    const senderName = currentUser?.name || currentUser?.email.split('@')[0] || "User";
    const userMsg: BookingMessage = {
      id: `msg-user-${Date.now()}`,
      senderId: currentUser?.id || "guest",
      senderName,
      text,
      createdAt: new Date().toISOString()
    };

    // Store in backend (using memory store helper)
    addBookingMessage(bookingId, userMsg);
    onStatusChanged();

    // Trigger AI response to simulate direct messaging
    if (currentUser?.role === 'guest') {
      try {
        const booking = getBookings().find(b => b.id === bookingId);
        const currentMessages = booking?.messages || [userMsg];
        const listing = getListings().find(l => l.id === booking?.listingId);
        const landlordName = listing?.landlordId === 'landlord-carlos' ? 'Carlos Silva' : 'Marta Gomez';

        const response = await fetch('/api/chat-landlord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageHistory: currentMessages,
            listingTitle: booking?.listingTitle,
            landlordName: landlordName,
            guestName: currentUser.name
          })
        });

        if (response.ok) {
          const data = await response.json();
          addBookingMessage(bookingId, {
            senderId: listing?.landlordId || 'landlord-carlos',
            senderName: landlordName,
            text: data.text || `Hi Moses! Thank you for the update. I look forward to finalizing the details.`
          });
          onStatusChanged();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Landlord is sending message, simulate Guest reply
      try {
        const booking = getBookings().find(b => b.id === bookingId);
        const currentMessages = booking?.messages || [userMsg];

        const response = await fetch('/api/chat-landlord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageHistory: currentMessages,
            listingTitle: booking?.listingTitle,
            landlordName: currentUser?.name || 'Landlord',
            guestName: booking?.guestName
          })
        });

        if (response.ok) {
          const data = await response.json();
          addBookingMessage(bookingId, {
            senderId: booking?.guestId || 'guest',
            senderName: booking?.guestName || 'Moses Archibong',
            text: data.text || `Hola Carlos! Thank you, let me know if there's anything else you need.`
          });
          onStatusChanged();
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsSendingMessage(null);
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Please sign in to view your bookings.</p>
      </div>
    );
  }

  const isLandlord = currentUser.role === 'landlord';
  const allBookings = getBookings();
  const allListings = getListings();

  // Filter listings owned by current landlord
  const landlordListings = allListings.filter(l => l.landlordId === currentUser.id);
  const landlordListingIds = landlordListings.map(l => l.id);

  // Filter bookings:
  // - If landlord: Bookings for listings owned by this landlord
  // - If guest: Bookings made by this guest
  const relevantBookings = isLandlord
    ? allBookings.filter(b => landlordListingIds.includes(b.listingId))
    : allBookings.filter(b => b.guestId === currentUser.id);

  const pendingBookings = relevantBookings.filter(b => b.status === 'pending');
  const processedBookings = relevantBookings.filter(b => b.status !== 'pending');

  const displayedBookings = activeTab === 'pending' ? pendingBookings : relevantBookings;

  const handleAction = (bookingId: string, action: 'approved' | 'rejected') => {
    const updated = updateBookingStatus(bookingId, action);
    if (updated) {
      setActionMessage(`Booking request ${action === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setTimeout(() => setActionMessage(null), 3000);
      onStatusChanged();
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: Booking['status'] }) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200/60',
      confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    };

    const icons = {
      pending: <Clock className="w-3.5 h-3.5" />,
      approved: <CheckCircle className="w-3.5 h-3.5" />,
      rejected: <XCircle className="w-3.5 h-3.5" />,
      confirmed: <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
    };

    const labels = {
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Declined',
      confirmed: 'Confirmed & Leased'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  // Landlord Stats Panel
  const renderLandlordStats = () => {
    const activeApprovedBookings = relevantBookings.filter(b => b.status === 'approved');
    const totalPotentialEarnings = activeApprovedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">My Listings</span>
            <span className="text-xl font-extrabold text-slate-800">{landlordListings.length} homes</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Pending Approvals</span>
            <span className="text-xl font-extrabold text-slate-800">{pendingBookings.length} requests</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Euro className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Active Booked Portfolio</span>
            <span className="text-xl font-extrabold text-emerald-600">€{totalPotentialEarnings.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            {isLandlord ? 'Owner Approvals Hub' : 'My Bookings & Requests'}
          </h2>
          <p className="text-sm text-slate-500">
            {isLandlord 
              ? 'Manage check-in requests, guest messages, and room approvals for your listings.'
              : 'Track the real-time status of your housing applications and reservation receipts.'}
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="bg-slate-100/80 p-1 rounded-xl flex self-start sm:self-center">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending ({pendingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Requests ({relevantBookings.length})
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-center text-xs text-emerald-700 font-semibold animate-fade-in flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Stats row */}
      {isLandlord && renderLandlordStats()}

      {/* Requests Feed */}
      {displayedBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100/80 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            {activeTab === 'pending' ? <Check className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm">No bookings found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {activeTab === 'pending'
                ? 'Great job! You have cleared all pending requests.'
                : 'You don&apos;t have any booking requests matching this criteria.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-slate-200 transition-all group"
            >
              {/* Card Main Info Row */}
              <div className="flex flex-col lg:flex-row">
                {/* Property Image / Info Left Column */}
                <div className="flex items-center gap-4 p-5 lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-50 bg-slate-50/50">
                  <img
                    src={booking.listingImage}
                    alt={booking.listingTitle}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {booking.listingTitle}
                    </h4>
                    <span className="text-xs text-slate-400 block font-medium flex items-center gap-1">
                      <Euro className="w-3.5 h-3.5 text-slate-400" />
                      <strong>€{booking.listingPrice}</strong>/month
                    </span>
                  </div>
                </div>

                {/* Guest/Date Details Mid Column */}
                <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Guest Profile Details */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Guest Identity</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{booking.guestName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{booking.guestEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date Details */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Requested Period</span>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-emerald-600 flex items-center gap-1.5 pl-5">
                        <span>Total Value:</span>
                        <span>€{booking.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Control Bar */}
                <div className="p-5 flex flex-col items-center justify-center border-t lg:border-t-0 border-slate-50 lg:w-[220px] bg-slate-50/20 shrink-0 gap-2">
                  <div className="w-full flex justify-center">
                    <StatusBadge status={booking.status} />
                  </div>

                  {booking.status === 'pending' ? (
                    isLandlord ? (
                      // Landlord Approval Interactive CTAs
                      <div className="flex gap-2 w-full mt-2">
                        <button
                          onClick={() => handleAction(booking.id, 'approved')}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, 'rejected')}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[11px] font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 border border-transparent hover:border-rose-100"
                        >
                          <X className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      // Guest Pending State Indicator
                      <p className="text-[10px] text-slate-400 text-center mt-1">
                        Awaiting response within 48h
                      </p>
                    )
                  ) : booking.status === 'approved' ? (
                    // Approved State, Guest has to Sign lease and Pay deposit
                    !isLandlord ? (
                      <button
                        onClick={() => {
                          setCheckoutBooking(booking);
                          setCheckoutStep(1);
                          setLeaseSignName(booking.guestName);
                          setCardNumber('');
                          setCardExpiry('');
                          setCardCvv('');
                        }}
                        className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-500/10"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Sign & Pay Deposit</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-1 font-medium text-center">
                        Waiting for tenant lease signature
                      </span>
                    )
                  ) : booking.status === 'confirmed' ? (
                    <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 mt-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/20 animate-pulse">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Ready to Move In!
                    </span>
                  ) : null}

                  {/* Toggle messages CTA */}
                  <button
                    onClick={() => setActiveChatId(activeChatId === booking.id ? null : booking.id)}
                    className="mt-1.5 text-[10px] text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 py-1 px-2.5 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all w-full justify-center"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>{activeChatId === booking.id ? "Close Chat" : `Chat (${booking.messages?.length || 0})`}</span>
                  </button>
                </div>
              </div>

              {/* Lease Signed details */}
              {booking.status === 'confirmed' && (
                <div className="bg-indigo-50/30 border-t border-indigo-100/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Lease Signed & Deposit Paid</p>
                      <p className="text-[10px] text-slate-500 font-medium">Signed digitally by <strong>{booking.leaseSignedName || booking.guestName}</strong> on {booking.leaseSignedDate || new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Simulated download of PDF lease
                      const link = document.createElement('a');
                      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`FEDMAX DIGITAL LEASE AGREEMENT\n=============================\nProperty: ${booking.listingTitle}\nTenant: ${booking.leaseSignedName || booking.guestName}\nStart Date: ${booking.startDate}\nEnd Date: ${booking.endDate}\nRent: €${booking.listingPrice}/month\nDeposit paid: €${booking.listingPrice}\nStatus: VERIFIED & SEALED`);
                      link.setAttribute('download', `fedmax_lease_${booking.id}.txt`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-lg text-[10.5px] font-bold text-slate-600 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Download Signed Contract</span>
                  </button>
                </div>
              )}

              {/* Expandable Chat Tray */}
              {activeChatId === booking.id && (
                <div className="border-t border-slate-50 bg-slate-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      Live Chat with {isLandlord ? booking.guestName : "Landlord (Carlos Silva)"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-500" />
                      Encrypted & Guarded
                    </span>
                  </div>

                  {/* Messages Bubble Thread */}
                  <div className="max-h-48 overflow-y-auto space-y-3 p-1 flex flex-col">
                    {(!booking.messages || booking.messages.length === 0) ? (
                      <div className="text-center py-6 text-xs text-slate-400 italic">
                        No messages yet. Send a greeting to start the conversation!
                      </div>
                    ) : (
                      booking.messages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
                            <div className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                            }`}>
                              <p className="font-extrabold text-[9px] opacity-75 mb-0.5 uppercase tracking-wider">{msg.senderName}</p>
                              <p className="font-medium">{msg.text}</p>
                            </div>
                            <span className="text-[8px] text-slate-400 mt-0.5 px-1 font-medium">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    {isSendingMessage === booking.id && (
                      <div className="flex items-start max-w-[85%] self-start">
                        <div className="bg-white text-slate-400 border border-slate-100 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs shadow-sm flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                          <span className="animate-pulse text-[10px] font-semibold text-slate-500">Typing secure response...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessageText[booking.id] || ''}
                      onChange={(e) => setChatMessageText(prev => ({ ...prev, [booking.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendChatMessage(booking.id);
                      }}
                      placeholder="Ask about keys, rent bills, check-in instructions..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                    <button
                      onClick={() => handleSendChatMessage(booking.id)}
                      disabled={isSendingMessage === booking.id}
                      className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SECURE CHECKOUT PORTAL OVERLAY MODAL */}
      {checkoutBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-800 text-sm">Secure Checkout Portal</h3>
              </div>
              <button 
                onClick={() => setCheckoutBooking(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps Progress Header */}
            <div className="flex bg-slate-50 border-b border-slate-100/80 px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className={`flex-1 flex items-center gap-1 ${checkoutStep === 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                <span>Contract</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-300 self-center mx-1" />
              <div className={`flex-1 flex items-center gap-1 ${checkoutStep === 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                <span>Payment</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-300 self-center mx-1" />
              <div className={`flex-1 flex items-center gap-1 ${checkoutStep === 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${checkoutStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                <span>Complete</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Step 1: Digital Lease Agreement */}
              {checkoutStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-sans space-y-3 max-h-52 overflow-y-auto text-[11px] text-slate-600 leading-relaxed shadow-inner">
                    <h4 className="font-extrabold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase">Digital Rental Agreement</h4>
                    <p>This Digital Rental Lease Agreement is made and entered into on this day by and between the Landlord and the Tenant named below.</p>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-700 font-semibold">
                      <div><strong>Landlord:</strong> Representative Owner</div>
                      <div><strong>Tenant:</strong> {checkoutBooking.guestName}</div>
                      <div><strong>Property:</strong> {checkoutBooking.listingTitle}</div>
                      <div><strong>Monthly Rent:</strong> €{checkoutBooking.listingPrice}</div>
                      <div><strong>Start Date:</strong> {new Date(checkoutBooking.startDate).toLocaleDateString()}</div>
                      <div><strong>End Date:</strong> {new Date(checkoutBooking.endDate).toLocaleDateString()}</div>
                    </div>
                    <p className="font-bold text-slate-700 mt-2">1. USE OF PROPERTY</p>
                    <p>The Tenant shall use the Premises strictly for residential purposes. The Premises shall not be used for any illegal or commercial operations.</p>
                    <p className="font-bold text-slate-700">2. SECURITY DEPOSIT</p>
                    <p>Prior to check-in, the Tenant must deposit one month's rent (€{checkoutBooking.listingPrice}) to the Landlord. This deposit shall be returned in full upon termination of the lease, minus any damages or outstanding bills.</p>
                    <p className="font-bold text-slate-700">3. CANCELLATION POLICY</p>
                    <p>Free cancellation is provided up to 30 days before the contract start date. Subsequent cancellations incur a 50% penalty of the security deposit.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Type your full legal name to sign digitally</label>
                    <input
                      type="text"
                      value={leaseSignName}
                      onChange={(e) => setLeaseSignName(e.target.value)}
                      placeholder="e.g. Moses Archibong"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (leaseSignName.trim().length > 2) {
                        setCheckoutStep(2);
                      }
                    }}
                    disabled={leaseSignName.trim().length < 3}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Deposit Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Payment Gateway */}
              {checkoutStep === 2 && (
                <div className="space-y-4">
                  {/* Card visual rendering */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between aspect-[1.6/1] border border-white/5 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Fedmax SafePay</div>
                      <CreditCard className="w-8 h-8 text-white/50" />
                    </div>
                    <div className="space-y-4">
                      <div className="text-sm font-mono tracking-[0.25em] h-6 flex items-center">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      <div className="flex justify-between text-[11px] font-mono">
                        <div>
                          <span className="text-[8px] text-white/40 block">Cardholder</span>
                          <span className="uppercase tracking-wide">{leaseSignName || "YOUR NAME"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-white/40 block">Expires</span>
                          <span>{cardExpiry || "MM/YY"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Credit Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(formatted);
                        }}
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Expiry Date</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) {
                              val = val.substring(0,2) + '/' + val.substring(2,4);
                            }
                            setCardExpiry(val);
                          }}
                          placeholder="MM/YY"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (cardNumber.replace(/\s/g, '').length >= 16 && cardExpiry.length === 5 && cardCvv.length === 3) {
                        setIsProcessingPayment(true);
                        await new Promise(resolve => setTimeout(resolve, 1800));
                        confirmBookingPayment(checkoutBooking.id, leaseSignName);
                        setIsProcessingPayment(false);
                        setCheckoutStep(3);
                        onStatusChanged();
                      }
                    }}
                    disabled={cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length !== 5 || cardCvv.length !== 3 || isProcessingPayment}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Authorizing Secure Deposit...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Authorize Deposit: €{checkoutBooking.listingPrice}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 3: Success Confirmation */}
              {checkoutStep === 3 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                    <CheckIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-base">Transaction Confirmed!</h4>
                    <p className="text-[10.5px] text-slate-500">Your digital lease is signed, security deposit paid, and move-in is officially sealed.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-1.5 max-w-sm mx-auto font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Receipt ID:</span>
                      <span className="font-bold text-slate-700 font-mono">REC-FM-{checkoutBooking.id.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Authorized Amount:</span>
                      <span className="font-bold text-emerald-600">€{checkoutBooking.listingPrice}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-indigo-600 uppercase tracking-wider text-[9px]">Verified Contract</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`FEDMAX DIGITAL LEASE AGREEMENT\n=============================\nProperty: ${checkoutBooking.listingTitle}\nTenant: ${leaseSignName}\nStart Date: ${checkoutBooking.startDate}\nEnd Date: ${checkoutBooking.endDate}\nRent: €${checkoutBooking.listingPrice}/month\nDeposit paid: €${checkoutBooking.listingPrice}\nStatus: VERIFIED & SEALED`);
                        link.setAttribute('download', `fedmax_lease_${checkoutBooking.id}.txt`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex-1 py-2 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl text-[10.5px] font-bold text-slate-600 flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Download Lease</span>
                    </button>
                    <button
                      onClick={() => {
                        setCheckoutBooking(null);
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <span>Close Portal</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
