import React, { useState, useEffect } from 'react';
import { fetchEmailLogs, clearEmailLogs, sendLandlordBookingNotification, EmailLogEntry } from '../services/emailService';
import { 
  getWelcomeEmailTemplate, 
  getRentDueReminderTemplate, 
  getMaintenanceRequestTemplate 
} from '../services/emailTemplates';
import { sendGmailMessage, getGmailProfile, GmailProfile } from '../services/gmailService';
import { googleSignIn, getAccessToken, logout as authLogout, initAuth } from '../lib/firebase';
import { 
  X, Mail, CheckCircle2, Eye, Trash2, Send, RefreshCw, 
  ShieldCheck, AlertCircle, FileText, Inbox, User, LogOut, Check, BellRing, Key
} from 'lucide-react';

interface EmailLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlordEmail?: string;
}

export default function EmailLogModal({ isOpen, onClose, landlordEmail }: EmailLogModalProps) {
  const [activeTab, setActiveTab] = useState<'gateway' | 'gmail'>('gateway');
  
  // Express Gateway state
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Gmail API state
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailUser, setGmailUser] = useState<any | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [isSigningInGmail, setIsSigningInGmail] = useState(false);
  
  // Gmail Form state
  const [templateType, setTemplateType] = useState<'welcome' | 'rent' | 'maintenance'>('rent');
  const [targetEmail, setTargetEmail] = useState('mosesarchibong004@gmail.com');
  const [targetName, setTargetName] = useState('Moses Archibong');
  const [listingTitle, setListingTitle] = useState('Modern Studio in Gran Vía, Madrid');
  const [rentAmount, setRentAmount] = useState('1200');
  const [dueDate, setDueDate] = useState('2026-09-01');
  const [maintenanceStatus, setMaintenanceStatus] = useState<'In Progress' | 'Scheduled' | 'Resolved' | 'Pending Review'>('In Progress');
  const [maintenanceNote, setMaintenanceNote] = useState('Technician scheduled for Thursday 10:00 AM');
  
  const [sendingGmail, setSendingGmail] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Init auth state listener
  useEffect(() => {
    if (isOpen) {
      initAuth(
        async (user, token) => {
          setGmailUser(user);
          setGmailToken(token);
          try {
            const profile = await getGmailProfile(token);
            setGmailProfile(profile);
          } catch (e) {
            console.warn('Could not fetch Gmail profile:', e);
          }
        },
        () => {
          setGmailUser(null);
          setGmailToken(null);
          setGmailProfile(null);
        }
      );
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchEmailLogs();
    const filtered = landlordEmail 
      ? data.filter(l => l.toEmail.toLowerCase() === landlordEmail.toLowerCase())
      : data;
    setLogs(filtered);
    if (filtered.length > 0 && !selectedLog) {
      setSelectedLog(filtered[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, landlordEmail]);

  if (!isOpen) return null;

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all email notification logs?')) {
      await clearEmailLogs();
      setLogs([]);
      setSelectedLog(null);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setTestFeedback(null);
    const target = landlordEmail || 'landlord@rentora.com';
    const res = await sendLandlordBookingNotification({
      bookingId: `test-${Date.now()}`,
      listingId: 'list-1',
      listingTitle: 'Bright Premium Room near Plaza Mayor',
      listingPrice: 650,
      guestName: 'Moses Archibong',
      guestEmail: 'mosesarchibong004@gmail.com',
      guestPhone: '+34 612 345 678',
      landlordEmail: target,
      landlordName: 'Carlos Silva',
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      billingCycle: 'monthly',
      totalAmount: 650,
      messageNote: 'Hola Carlos! I would love to reserve your Plaza Mayor room starting September. I am clean, non-smoker, and studying in Madrid.'
    });

    setSendingTest(false);
    if (res.success) {
      setTestFeedback(`✅ Email alert successfully dispatched to ${target}`);
      await loadLogs();
    } else {
      setTestFeedback(`❌ ${res.message}`);
    }
  };

  const handleConnectGmail = async () => {
    setIsSigningInGmail(true);
    setGmailFeedback(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGmailUser(res.user);
        setGmailToken(res.accessToken);
        const profile = await getGmailProfile(res.accessToken);
        setGmailProfile(profile);
        setGmailFeedback({ type: 'success', msg: `Connected as ${profile.emailAddress}` });
      }
    } catch (err: any) {
      console.error('Gmail Connect Error:', err);
      setGmailFeedback({ type: 'error', msg: err.message || 'Failed to authenticate with Google.' });
    } finally {
      setIsSigningInGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    await authLogout();
    setGmailUser(null);
    setGmailToken(null);
    setGmailProfile(null);
    setGmailFeedback(null);
  };

  // Get live template HTML for preview or sending
  const getSelectedTemplateData = () => {
    if (templateType === 'welcome') {
      return getWelcomeEmailTemplate({
        userName: targetName || 'Valued User',
        userEmail: targetEmail,
        role: 'guest',
        country: 'Spain',
        city: 'Madrid',
        preferredMarket: 'Gran Vía & Salamanca'
      });
    } else if (templateType === 'rent') {
      return getRentDueReminderTemplate({
        tenantName: targetName || 'Tenant',
        tenantEmail: targetEmail,
        listingTitle: listingTitle || 'Rental Property',
        amountDue: Number(rentAmount) || 1200,
        dueDate: dueDate || '2026-09-01',
        currencySymbol: '€',
        paymentLink: 'https://rentora-realestate.com'
      });
    } else {
      return getMaintenanceRequestTemplate({
        tenantName: targetName || 'Tenant',
        tenantEmail: targetEmail,
        listingTitle: listingTitle || 'Rental Property',
        ticketId: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        issueTitle: 'Water Heater & AC Maintenance Inspection',
        status: maintenanceStatus,
        landlordNote: maintenanceNote
      });
    }
  };

  const currentTemplate = getSelectedTemplateData();

  const handleSendViaGmailApi = async () => {
    if (!gmailToken) {
      alert('Please connect your Google / Gmail account first.');
      return;
    }

    setSendingGmail(true);
    setGmailFeedback(null);

    try {
      const res = await sendGmailMessage(gmailToken, {
        to: targetEmail,
        subject: currentTemplate.subject,
        htmlBody: currentTemplate.html,
        fromName: 'Rentora RealEstate',
        confirmPrompt: true // Mandated explicit confirmation before mutating user mailbox
      });

      setGmailFeedback({
        type: 'success',
        msg: `🎉 Email sent via Gmail REST API! Message ID: ${res.id}`
      });
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        setGmailFeedback({ type: 'error', msg: 'Send cancelled by user.' });
      } else {
        setGmailFeedback({ type: 'error', msg: err.message || 'Failed to send message via Gmail API.' });
      }
    } finally {
      setSendingGmail(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-log-title"
    >
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close email dispatch logs modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
              <Mail className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Rentora Notification Center &amp; Gmail OAuth
            </span>
          </div>

          <h2 id="email-log-title" className="text-xl font-display font-black text-white">
            Email System &amp; Gmail Integration
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Dispatch automated landlord booking alerts, send rent payment reminders, and dispatch maintenance updates directly via Gmail API.
          </p>

          {/* Navigation Tabs */}
          <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-0">
            <button
              onClick={() => setActiveTab('gateway')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'gateway'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Inbox className="w-4 h-4 text-emerald-600" />
              <span>Express Email Logs ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'gmail'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-rose-500" />
              <span>Send via Gmail API</span>
              {gmailToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Express Email Logs */}
        {activeTab === 'gateway' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-spin' : ''}`} />
                  <span>{sendingTest ? 'Dispatching...' : 'Send Test Booking Email Alert'}</span>
                </button>

                <button
                  onClick={loadLogs}
                  disabled={loading}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {logs.length > 0 && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              )}
            </div>

            {testFeedback && (
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testFeedback}</span>
              </div>
            )}

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              
              {/* Left Column: Email Log List */}
              <div className="md:col-span-5 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Sent Emails ({logs.length})
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    EmailJS / Express Trigger
                  </span>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading email logs...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No Email Alerts Dispatched Yet</p>
                    <p className="text-[11px] text-slate-400">
                      When a tenant submits a booking request, an email notification will automatically trigger here.
                    </p>
                  </div>
                ) : (
                  logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <button
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-extrabold text-slate-400">
                            {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            log.status === 'sent' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {log.serviceUsed} • {log.status}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          {log.subject}
                        </h4>

                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate">To: {log.toEmail}</span>
                          <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: HTML Email Rendered Preview */}
              <div className="md:col-span-7 flex flex-col overflow-hidden bg-white p-4">
                {selectedLog ? (
                  <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{selectedLog.subject}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(selectedLog.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div><strong className="text-slate-800">To:</strong> {selectedLog.toName} ({selectedLog.toEmail})</div>
                        <div><strong className="text-slate-800">Trigger:</strong> {selectedLog.serviceUsed}</div>
                        <div><strong className="text-slate-800">Guest:</strong> {selectedLog.guestName}</div>
                        <div><strong className="text-slate-800">Property:</strong> {selectedLog.listingTitle}</div>
                      </div>
                    </div>

                    <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner flex flex-col">
                      <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Rendered HTML Email Mailbox Preview</span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Live Template</span>
                      </div>
                      <iframe
                        srcDoc={selectedLog.bodyHtml}
                        title="Email Preview"
                        className="w-full flex-1 border-none bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Mail className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Select an email log from the left list to view HTML preview</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Send via Gmail API */}
        {activeTab === 'gmail' && (
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/50">
            
            {/* Left Column: Gmail Authentication & Form */}
            <div className="md:col-span-5 p-5 space-y-5 overflow-y-auto">
              
              {/* Account Status Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    <span>Gmail API Connection</span>
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    gmailToken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {gmailToken ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                {gmailProfile ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {gmailProfile.emailAddress}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Total Messages: <strong>{gmailProfile.messagesTotal}</strong></span>
                      <span>Threads: <strong>{gmailProfile.threadsTotal}</strong></span>
                    </div>
                    <button
                      onClick={handleDisconnectGmail}
                      className="w-full mt-2 py-1.5 text-xs text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect Gmail</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    disabled={isSigningInGmail}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"/>
                    </svg>
                    <span>{isSigningInGmail ? 'Authenticating...' : 'Sign in with Google / Authorize Gmail'}</span>
                  </button>
                )}
              </div>

              {/* Template Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Select Email Template</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTemplateType('rent')}
                    className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      templateType === 'rent' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rent Due
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('welcome')}
                    className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      templateType === 'welcome' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Welcome
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('maintenance')}
                    className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      templateType === 'maintenance' ? 'bg-white text-sky-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Maintenance
                  </button>
                </div>
              </div>

              {/* Template Fields */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Listing Title</label>
                  <input
                    type="text"
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {templateType === 'rent' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount Due (€)</label>
                      <input
                        type="number"
                        value={rentAmount}
                        onChange={(e) => setRentAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {templateType === 'maintenance' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                      <select
                        value={maintenanceStatus}
                        onChange={(e: any) => setMaintenanceStatus(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Pending Review">Pending Review</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Landlord Note</label>
                      <input
                        type="text"
                        value={maintenanceNote}
                        onChange={(e) => setMaintenanceNote(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {gmailFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  gmailFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-100 text-rose-900 border border-rose-200'
                }`}>
                  {gmailFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{gmailFeedback.msg}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleSendViaGmailApi}
                disabled={sendingGmail || !gmailToken}
                className={`w-full py-3 px-4 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gmailToken
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className={`w-4 h-4 ${sendingGmail ? 'animate-spin' : ''}`} />
                <span>
                  {sendingGmail 
                    ? 'Dispatching via Gmail API...' 
                    : gmailToken 
                    ? 'Send Email via Gmail API (Requires Confirmation)' 
                    : 'Connect Gmail Account First'}
                </span>
              </button>

            </div>

            {/* Right Column: Live Email HTML Template Preview */}
            <div className="md:col-span-7 flex flex-col overflow-hidden bg-white p-4">
              <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner flex flex-col">
                <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Gmail HTML Body Live Preview ({templateType.toUpperCase()})</span>
                  <span className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                    Official Template
                  </span>
                </div>
                <iframe
                  srcDoc={currentTemplate.html}
                  title="Gmail Preview"
                  className="w-full flex-1 border-none bg-white"
                />
              </div>
            </div>

          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center shrink-0 flex items-center justify-between px-6">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gmail API OAuth 2.0 &amp; Node Express Mail Engine Active</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
