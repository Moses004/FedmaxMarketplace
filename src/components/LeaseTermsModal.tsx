import React from 'react';
import { motion } from 'motion/react';
import { X, FileText, ShieldCheck, CheckCircle2, AlertCircle, Clock, Home, Key, Download, Printer } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface LeaseTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  landlordName?: string;
  monthlyRent: number;
}

export default function LeaseTermsModal({
  isOpen,
  onClose,
  propertyTitle,
  landlordName = 'Verified Property Owner',
  monthlyRent
}: LeaseTermsModalProps) {
  const toast = useToast();

  // Keyboard Escape listener
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrintOrDownload = () => {
    toast.success('Lease Summary Ready', 'Preparing printable rental terms & policy digest.');
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lease-terms-title"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="lease-terms-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Standard Lease Policy &amp; Terms
                </h3>
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Rentora Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Transparent leasing terms for &ldquo;{propertyTitle}&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            aria-label="Close lease terms modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Overview Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lister / Landlord</span>
            <span className="font-extrabold text-slate-800 dark:text-white">{landlordName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Base Monthly Rent</span>
            <span className="font-extrabold text-emerald-600">${monthlyRent.toLocaleString()} / month</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Approval Guarantee</span>
            <span className="font-extrabold text-slate-800 dark:text-white">48 Hours SLA</span>
          </div>
        </div>

        {/* Clauses List */}
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Clause 1: Security Deposit & Escrow Protection */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1. Security Deposit &amp; Escrow Protection</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All security deposits are held in a neutral client-escrow account. Deposits are fully refundable within 14 business days after move-out inspection, subject only to fair wear and tear or mutually documented damages.
            </p>
          </div>

          {/* Clause 2: 48-Hour Landlord Response Guarantee */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-sm">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. 48-Hour Reservation &amp; Payment SLA</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When you submit a reservation request, your payment card is only authorized—not debited. The landlord has 48 hours to accept or decline. If declined or expired, the authorization is released instantly with zero charge.
            </p>
          </div>

          {/* Clause 3: Maintenance & Repairs Responsibilities */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-sm">
              <Home className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3. Property Maintenance &amp; Structural Repairs</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The property lister is responsible for structural integrity, plumbing, electrical systems, and essential HVAC repairs. Minor consumable items (such as lightbulbs or routine cleaning) are the responsibility of the tenant during occupancy.
            </p>
          </div>

          {/* Clause 4: Lease Renewal & Early Termination */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-sm">
              <Key className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>4. Notice Period &amp; Lease Renewal Option</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Either party may provide a standard 30-day notice prior to lease expiration to terminate or renegotiate annual renewal rates. Subletting or unauthorized commercial usage is prohibited without written landlord endorsement.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrintOrDownload}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
