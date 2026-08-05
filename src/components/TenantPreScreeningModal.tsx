import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, UserCheck, Briefcase, DollarSign, Users, Home, FileText, CheckCircle2, AlertCircle, Copy, Check, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface TenantPreScreeningData {
  employmentStatus: 'full_time' | 'part_time' | 'self_employed' | 'student' | 'retired';
  employerOrSchool: string;
  monthlyIncomeRange: string;
  occupantsCount: number;
  hasPets: 'no' | 'dog' | 'cat' | 'other';
  referenceName: string;
  referencePhoneOrEmail: string;
  moveInFlexibility: 'immediate' | 'within_2_weeks' | 'within_30_days' | 'flexible';
  additionalNotes: string;
}

interface TenantPreScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  onSavePreScreening: (data: TenantPreScreeningData) => void;
}

const STORAGE_KEY = 'rentora_tenant_prescreening_profile';

export default function TenantPreScreeningModal({
  isOpen,
  onClose,
  propertyTitle,
  onSavePreScreening
}: TenantPreScreeningModalProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<TenantPreScreeningData>({
    employmentStatus: 'full_time',
    employerOrSchool: '',
    monthlyIncomeRange: '3000_5000',
    occupantsCount: 1,
    hasPets: 'no',
    referenceName: '',
    referencePhoneOrEmail: '',
    moveInFlexibility: 'within_2_weeks',
    additionalNotes: ''
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setFormData(JSON.parse(saved));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      // ignore
    }
    onSavePreScreening(formData);
    setIsSaved(true);
    toast.success('Pre-Screening Profile Saved', 'Your tenant application profile has been verified and attached to this property.');
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const generateSummaryText = () => {
    const incomeLabels: Record<string, string> = {
      'under_2000': 'Under $2,000 / mo',
      '2000_3000': '$2,000 - $3,000 / mo',
      '3000_5000': '$3,000 - $5,000 / mo',
      '5000_8000': '$5,000 - $8,000 / mo',
      'above_8000': '$8,000+ / mo'
    };
    const empLabels: Record<string, string> = {
      'full_time': 'Full-Time Employed',
      'part_time': 'Part-Time Employed',
      'self_employed': 'Self-Employed / Entrepreneur',
      'student': 'University Student / Researcher',
      'retired': 'Retired / Pensioner'
    };
    return `[RENTORA VERIFIED TENANT PRE-SCREENING]
• Property: ${propertyTitle}
• Employment: ${empLabels[formData.employmentStatus] || formData.employmentStatus} (${formData.employerOrSchool || 'N/A'})
• Monthly Income Range: ${incomeLabels[formData.monthlyIncomeRange] || formData.monthlyIncomeRange}
• Occupants: ${formData.occupantsCount} person(s)
• Pets: ${formData.hasPets.toUpperCase()}
• Move-In Flexibility: ${formData.moveInFlexibility.replace(/_/g, ' ')}
• Reference: ${formData.referenceName || 'Available on request'}`;
  };

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(generateSummaryText());
    setCopied(true);
    toast.success('Profile Copied', 'Copied your verified pre-screening profile to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-prescreening-title"
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
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="tenant-prescreening-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Tenant Pre-Screening Application
                </h3>
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Verification
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Complete your tenant profile once to increase landlord approval rates by 4.5x
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            aria-label="Close tenant pre-screening modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <p className="font-bold">Why complete Pre-Screening?</p>
            <p className="text-slate-600 dark:text-slate-400">
              Landlords on Rentora prioritize tenants with verified employment and income brackets. Your personal data is encrypted and only shared with the property lister when you request a booking.
            </p>
          </div>
        </div>

        {isSaved ? (
          <div className="p-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
              Pre-Screening Profile Attached!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your application details have been saved and ready to accompany your booking request for &ldquo;{propertyTitle}&rdquo;.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Employment Status & Employer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Employment / Occupation *
                </label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="full_time">Full-Time Employed</option>
                  <option value="part_time">Part-Time Employed</option>
                  <option value="self_employed">Self-Employed / Business Owner</option>
                  <option value="student">University Student / Postgrad</option>
                  <option value="retired">Retired / Pensioner</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Employer or University Name *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.employerOrSchool}
                    onChange={(e) => setFormData({ ...formData, employerOrSchool: e.target.value })}
                    placeholder="e.g. Google, Shell, University of Lagos..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Monthly Income Range & Number of Occupants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Monthly Gross Income Bracket *
                </label>
                <select
                  value={formData.monthlyIncomeRange}
                  onChange={(e) => setFormData({ ...formData, monthlyIncomeRange: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="under_2000">Under $2,000 / month</option>
                  <option value="2000_3000">$2,000 - $3,000 / month</option>
                  <option value="3000_5000">$3,000 - $5,000 / month</option>
                  <option value="5000_8000">$5,000 - $8,000 / month</option>
                  <option value="above_8000">$8,000+ / month (High Earning)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Total Number of Occupants *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.occupantsCount}
                    onChange={(e) => setFormData({ ...formData, occupantsCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Pets & Move-in Flexibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Will You Bring Any Pets? *
                </label>
                <select
                  value={formData.hasPets}
                  onChange={(e) => setFormData({ ...formData, hasPets: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="no">No Pets</option>
                  <option value="dog">Yes - Small/Medium Dog</option>
                  <option value="cat">Yes - Cat(s)</option>
                  <option value="other">Yes - Other Pet(s)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Move-In Timeline &amp; Flexibility *
                </label>
                <select
                  value={formData.moveInFlexibility}
                  onChange={(e) => setFormData({ ...formData, moveInFlexibility: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="immediate">Immediate Move-in Available</option>
                  <option value="within_2_weeks">Within 2 Weeks</option>
                  <option value="within_30_days">Within 30 Days</option>
                  <option value="flexible">Flexible (1-2 Months)</option>
                </select>
              </div>
            </div>

            {/* Row 4: Reference Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Previous Landlord / Reference Name
                </label>
                <input
                  type="text"
                  value={formData.referenceName}
                  onChange={(e) => setFormData({ ...formData, referenceName: e.target.value })}
                  placeholder="e.g. Dr. Samuel Okafor (Optional)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reference Phone or Email
                </label>
                <input
                  type="text"
                  value={formData.referencePhoneOrEmail}
                  onChange={(e) => setFormData({ ...formData, referencePhoneOrEmail: e.target.value })}
                  placeholder="e.g. +234 802 ... or email"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Copyable Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Generated Tenant Summary Card
                </span>
                <button
                  type="button"
                  onClick={handleCopyProfile}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {generateSummaryText()}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save &amp; Attach Profile</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
