import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Wrench, AlertTriangle, CheckCircle2, Clock, Building, Send, ShieldAlert, Sparkles, Upload, FileText, Bot, AlertOctagon, Check, ArrowRight } from 'lucide-react';
import { Booking, Listing } from '../types';
import { useToast } from '../context/ToastContext';

interface ReportMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  userEmail?: string;
  userName?: string;
}

export type TriagePriority = 'low' | 'medium' | 'high' | 'emergency';

export interface TriageResult {
  priority: TriagePriority;
  reasoning: string;
  recommendedAction: string;
  estimatedTurnaround: string;
  riskFactors: string[];
  aiGenerated?: boolean;
}

export default function ReportMaintenanceModal({
  isOpen,
  onClose,
  bookings,
  userEmail,
  userName
}: ReportMaintenanceModalProps) {
  const toast = useToast();

  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [issueCategory, setIssueCategory] = useState<string>('Plumbing & Water');
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [priority, setPriority] = useState<TriagePriority>('medium');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [ticketCode, setTicketCode] = useState<string>('');

  // AI Triage states
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [triageData, setTriageData] = useState<TriageResult | null>(null);

  // Auto-select first booking if available
  useEffect(() => {
    if (bookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookings, selectedBookingId]);

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

  if (!isOpen) return null;

  const activeBooking = bookings.find(b => b.id === selectedBookingId) || bookings[0];

  // AI Triage API caller
  const runAiTriage = async (titleToUse?: string, descToUse?: string) => {
    const currentTitle = titleToUse !== undefined ? titleToUse : issueTitle;
    const currentDesc = descToUse !== undefined ? descToUse : description;

    if (!currentTitle.trim() && !currentDesc.trim()) {
      toast.error('Details Required', 'Please type an issue title or description for AI triage.');
      return;
    }

    setIsTriaging(true);
    try {
      const response = await fetch('/api/triage-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueTitle: currentTitle,
          issueCategory,
          description: currentDesc,
          listingTitle: activeBooking?.listingTitle || 'Rented Residence'
        })
      });

      if (!response.ok) {
        throw new Error('Triage service error');
      }

      const result: TriageResult = await response.json();
      setTriageData(result);
      setPriority(result.priority);
      toast.success(
        'AI Triage Analysis Complete',
        `Priority set to ${result.priority.toUpperCase()} based on safety and property impact.`
      );
    } catch (err) {
      console.error('AI Triage error:', err);
      // Fallback client-side triage
      const text = `${currentTitle} ${currentDesc}`.toLowerCase();
      let fallP: TriagePriority = 'medium';
      let fallReason = 'Standard functional maintenance issue requiring technician review.';
      let fallAction = 'Schedule technician inspection within normal operating hours.';
      let fallTime = '24-48 Hours';

      if (/gas|spark|fire|flood|burst|lockout|break-in/i.test(text)) {
        fallP = 'emergency';
        fallReason = 'Emergency risk detected: danger to life, major flooding, or total security failure.';
        fallAction = 'Shut off main water/gas valves immediately and contact emergency response.';
        fallTime = 'Under 2 Hours';
      } else if (/leak|no heat|no hot water|fridge|breaker/i.test(text)) {
        fallP = 'high';
        fallReason = 'High impact issue affecting essential utilities or active water leaks.';
        fallAction = 'Dispatch certified service technician for same-day resolution.';
        fallTime = 'Within 24 Hours';
      } else if (/squeak|paint|knob|cosmetic/i.test(text)) {
        fallP = 'low';
        fallReason = 'Minor cosmetic or low impact maintenance request.';
        fallAction = 'Log for routine scheduled maintenance pass.';
        fallTime = '3-5 Business Days';
      }

      setTriageData({
        priority: fallP,
        reasoning: fallReason,
        recommendedAction: fallAction,
        estimatedTurnaround: fallTime,
        riskFactors: [fallP === 'emergency' ? 'Safety Risk' : 'Standard Priority'],
        aiGenerated: false
      });
      setPriority(fallP);
    } finally {
      setIsTriaging(false);
    }
  };

  // Sample quick presets to test triage
  const handleQuickPreset = (presetTitle: string, presetCategory: string, presetDesc: string) => {
    setIssueTitle(presetTitle);
    setIssueCategory(presetCategory);
    setDescription(presetDesc);
    runAiTriage(presetTitle, presetDesc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) {
      toast.error('Missing Field', 'Please enter a title for the maintenance issue.');
      return;
    }

    setIsSubmitting(true);
    const newTicketCode = `TICK-${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setTicketCode(newTicketCode);
      setIsSubmitted(true);
      toast.success(
        'Maintenance Ticket Logged',
        `Ticket #${newTicketCode} [${priority.toUpperCase()}] sent to property management.`
      );
    }, 800);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setIssueTitle('');
    setDescription('');
    setTriageData(null);
    setPriority('medium');
    onClose();
  };

  const getPriorityBadgeStyle = (p: TriagePriority) => {
    switch (p) {
      case 'emergency':
        return {
          badge: 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse',
          label: 'Emergency (Immediate Action)',
          icon: ShieldAlert,
          bgContainer: 'bg-gradient-to-r from-rose-950/80 via-red-900/60 to-slate-900 text-white border-rose-800'
        };
      case 'high':
        return {
          badge: 'bg-rose-100 text-rose-800 border border-rose-300',
          label: 'High Urgency (24h Window)',
          icon: AlertOctagon,
          bgContainer: 'bg-rose-50 border-rose-200 text-rose-950'
        };
      case 'medium':
        return {
          badge: 'bg-amber-100 text-amber-900 border border-amber-300',
          label: 'Medium Urgency (2-3 Days)',
          icon: Clock,
          bgContainer: 'bg-amber-50 border-amber-200 text-amber-950'
        };
      case 'low':
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border border-slate-300',
          label: 'Low Urgency (3-5 Days)',
          icon: CheckCircle2,
          bgContainer: 'bg-slate-50 border-slate-200 text-slate-900'
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-maintenance-title"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl my-6 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close maintenance report modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400">
              <Wrench className="w-5 h-5" />
            </span>
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Tenant Portal</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3 h-3" />
                AI Auto-Triage Active
              </span>
            </span>
          </div>

          <h2 id="report-maintenance-title" className="text-xl font-display font-black text-white">
            Report Property Maintenance
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Submit a repair request analyzed by AI to automatically determine priority and dispatch timeframes.
          </p>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4 bg-white">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Maintenance Request Logged!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ticket <span className="font-extrabold text-slate-900">{ticketCode}</span> for{' '}
                <strong className="text-slate-800">{activeBooking?.listingTitle || 'your rented property'}</strong> has been dispatched.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Issue Title:</span>
                <span className="font-bold text-slate-800">{issueTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-bold text-slate-800">{issueCategory}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2 items-center">
                <span className="text-slate-500 font-medium">Assigned AI Priority:</span>
                <span className={`font-black uppercase text-[10px] px-2.5 py-1 rounded-full ${
                  priority === 'emergency' ? 'bg-rose-950 text-rose-300 animate-pulse' :
                  priority === 'high' ? 'bg-rose-100 text-rose-800' :
                  priority === 'medium' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-800'
                }`}>
                  {priority} Priority
                </span>
              </div>
              {triageData?.estimatedTurnaround && (
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Estimated Turnaround:</span>
                  <span className="font-bold text-indigo-700">{triageData.estimatedTurnaround}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Dispatched &amp; Queued</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
            
            {/* Property Selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span>Select Rented Property</span>
                <span className="text-[10px] text-slate-400 font-normal">Active Leases</span>
              </label>
              {bookings.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No active booking selected. Standard issue submission mode active.</span>
                </div>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.listingTitle} (€{b.listingPrice}/mo)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Presets to test triage */}
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Sample Issues (Click to Test AI Triage)
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Gas smell in kitchen', 'Heating & AC', 'Strong odor of natural gas coming from stove area.')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  🚨 Gas Leak (Emergency)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Active water pipe burst', 'Plumbing & Water', 'Main bathroom pipe burst with heavy water flowing onto floor.')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  🌊 Water Burst (Emergency)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Refrigerator stopped cooling', 'Electrical & Power', 'Fridge is warm and food is spoiling rapidly.')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                >
                  🧊 Fridge Failure (High)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Squeaky bedroom door hinge', 'General Maintenance', 'Door hinges squeak when opening.')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  🚪 Squeaky Hinge (Low)
                </button>
              </div>
            </div>

            {/* Category & Priority Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1.5">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="Plumbing & Water">Plumbing &amp; Water Leak</option>
                  <option value="Heating & AC">Heating &amp; Air Conditioning</option>
                  <option value="Electrical & Power">Electrical &amp; Appliances</option>
                  <option value="Locks & Security">Locks, Doors &amp; Keys</option>
                  <option value="Structural & Damage">Structural, Windows &amp; Walls</option>
                  <option value="Pest Control">Pest Control &amp; Sanitation</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1.5">Priority Level</label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      priority === 'low' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      priority === 'medium' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Med
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      priority === 'high' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('emergency')}
                    className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      priority === 'emergency' ? 'bg-rose-950 text-rose-300 shadow-xs animate-pulse' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Emerg
                  </button>
                </div>
              </div>
            </div>

            {/* Issue Title with AI Analyze trigger */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700">Issue Summary / Title</label>
                <button
                  type="button"
                  onClick={() => runAiTriage()}
                  disabled={isTriaging}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                >
                  <Sparkles className={`w-3 h-3 ${isTriaging ? 'animate-spin' : ''}`} />
                  <span>{isTriaging ? 'Analyzing...' : 'Run AI Triage'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Water leak under main sink near electrical outlet"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5">Detailed Explanation</label>
              <textarea
                rows={2}
                placeholder="Describe when the issue started, exact location, and safety risks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* AI TRIAGE RESULT CARD */}
            {triageData && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border ${getPriorityBadgeStyle(triageData.priority).bgContainer} space-y-2.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-white/20 rounded-lg">
                      <Bot className="w-4 h-4" />
                    </span>
                    <span className="font-black text-xs uppercase tracking-wider">
                      AI Maintenance Triage Assessment
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getPriorityBadgeStyle(triageData.priority).badge}`}>
                    {triageData.priority} Priority
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-medium opacity-90 leading-relaxed">
                    <strong className="font-extrabold">Triage Analysis:</strong> {triageData.reasoning}
                  </p>
                  <p className="font-medium opacity-90 leading-relaxed">
                    <strong className="font-extrabold">Recommended Action:</strong> {triageData.recommendedAction}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-current/15 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span>Target Turnaround: <strong className="font-bold">{triageData.estimatedTurnaround}</strong></span>
                  </div>
                  {triageData.riskFactors?.length > 0 && (
                    <div className="flex gap-1">
                      {triageData.riskFactors.map((rf, i) => (
                        <span key={i} className="px-2 py-0.5 bg-black/10 rounded-md font-bold text-[10px]">
                          {rf}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Simulated Photo Attachment */}
            <div className="p-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center text-xs space-y-1">
              <Upload className="w-4 h-4 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 text-[11px]">Attach Photos or Video Proof (Optional)</p>
              <p className="text-[10px] text-slate-400">PNG, JPG or MP4 up to 25MB</p>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => runAiTriage()}
                disabled={isTriaging}
                className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Triage Priority</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Dispatching Ticket...' : 'Submit Maintenance Ticket'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </motion.div>
    </div>
  );
}
