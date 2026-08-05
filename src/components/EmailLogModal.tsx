import React, { useState, useEffect } from 'react';
import { fetchEmailLogs, clearEmailLogs, sendLandlordBookingNotification, EmailLogEntry } from '../services/emailService';
import { 
  X, Mail, CheckCircle2, Clock, Eye, Trash2, Send, RefreshCw, 
  Sparkles, ExternalLink, ShieldCheck, AlertCircle, FileText, Inbox, User, Building
} from 'lucide-react';

interface EmailLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlordEmail?: string;
}

export default function EmailLogModal({ isOpen, onClose, landlordEmail }: EmailLogModalProps) {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

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

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchEmailLogs();
    // Filter by landlord email if provided, else show all
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
    const targetEmail = landlordEmail || 'landlord@rentora.com';
    const res = await sendLandlordBookingNotification({
      bookingId: `test-${Date.now()}`,
      listingId: 'list-1',
      listingTitle: 'Bright Premium Room near Plaza Mayor',
      listingPrice: 650,
      guestName: 'Moses Archibong',
      guestEmail: 'mosesarchibong004@gmail.com',
      guestPhone: '+34 612 345 678',
      landlordEmail: targetEmail,
      landlordName: 'Carlos Silva',
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      billingCycle: 'monthly',
      totalAmount: 650,
      messageNote: 'Hola Carlos! I would love to reserve your Plaza Mayor room starting September. I am clean, non-smoker, and studying in Madrid.'
    });

    setSendingTest(false);
    if (res.success) {
      setTestFeedback(`✅ Email alert successfully dispatched to ${targetEmail}`);
      await loadLogs();
    } else {
      setTestFeedback(`❌ ${res.message}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-log-title"
    >
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[85vh]">
        
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
              Notification Engine &amp; EmailJS Integration
            </span>
          </div>

          <h2 id="email-log-title" className="text-xl font-display font-black text-white">
            Landlord Email Dispatch Logs
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time tracking of automated email alerts dispatched to landlords upon new tenant booking requests.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            )}
          </div>

          {testFeedback && (
            <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testFeedback}</span>
            </div>
          )}
        </div>

        {/* Content Body: Split View (Left Logs List, Right Email HTML Preview) */}
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
                  When a tenant submits a booking request, an email notification will automatically trigger here. Click &quot;Send Test Booking Email Alert&quot; above to test.
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
                {/* Email Metadata Card */}
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

                {/* Email Body Iframe / Rendered Preview */}
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

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center shrink-0 flex items-center justify-between px-6">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>EmailJS REST API &amp; Node Express Mail Trigger active</span>
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
