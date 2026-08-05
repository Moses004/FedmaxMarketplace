import React, { useState } from 'react';
import { X, Bell, Mail, MessageCircle, CheckCircle2, Search, MapPin, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface SavedSearchAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSearchQuery: string;
  selectedCountry: string;
  selectedCity: string;
  selectedArea: string;
  selectedCategory: string;
  maxPrice: string;
  userEmail?: string;
}

export default function SavedSearchAlertModal({
  isOpen,
  onClose,
  currentSearchQuery,
  selectedCountry,
  selectedCity,
  selectedArea,
  selectedCategory,
  maxPrice,
  userEmail = ''
}: SavedSearchAlertModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState<string>(userEmail);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  const [alertChannels, setAlertChannels] = useState<{ email: boolean; whatsapp: boolean }>({
    email: true,
    whatsapp: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alertChannels.email && !email.trim()) {
      toast.error('Email Required', 'Please enter your email address for alerts');
      return;
    }
    if (alertChannels.whatsapp && !whatsappPhone.trim()) {
      toast.error('WhatsApp Required', 'Please enter your WhatsApp phone number');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('Alert Created', 'Saved search & instant alert created successfully!');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 700);
  };

  const filterSummary = [
    selectedCountry !== 'all' ? selectedCountry : 'All Countries',
    selectedCity !== 'all' ? selectedCity : null,
    selectedArea !== 'all' ? selectedArea : null,
    selectedCategory !== 'all' ? selectedCategory.replace(/_/g, ' ') : null,
    maxPrice && maxPrice !== 'all' ? `Max $${maxPrice}` : null,
    currentSearchQuery ? `"${currentSearchQuery}"` : null
  ].filter(Boolean).join(' • ');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-search-alert-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="saved-search-alert-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                Save Search &amp; Set Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get notified as soon as new properties match this search
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            aria-label="Close saved search alert modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Current Search Summary Badge */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Saved Search Criteria
          </span>
          <div className="flex items-center gap-2 font-extrabold text-xs text-slate-800 dark:text-white">
            <Search className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="line-clamp-2">{filterSummary || 'All Available Rental Listings'}</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
              Alert Successfully Created!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              We will send you notifications as soon as new verified properties matching your criteria are published on Rentora.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Alert Channel Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Notification Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertChannels({ ...alertChannels, email: !alertChannels.email })}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    alertChannels.email
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-bold">Email Alerts</span>
                  </div>
                  {alertChannels.email && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setAlertChannels({ ...alertChannels, whatsapp: !alertChannels.whatsapp })}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    alertChannels.whatsapp
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">WhatsApp Alerts</span>
                  </div>
                  {alertChannels.whatsapp && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* Email Address Input */}
            {alertChannels.email && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address for Alerts *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required={alertChannels.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. mosesarchibong004@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* WhatsApp Phone Number Input */}
            {alertChannels.whatsapp && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  WhatsApp Phone Number *
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required={alertChannels.whatsapp}
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Frequency options */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Alert Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'instant', label: 'Instant' },
                  { id: 'daily', label: 'Daily Digest' },
                  { id: 'weekly', label: 'Weekly Summary' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFrequency(opt.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      frequency === opt.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
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
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Bell className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Activate Alert'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
