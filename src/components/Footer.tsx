import React, { useState } from 'react';
import { 
  Building2, ShieldCheck, Zap, Mail, ArrowRight, CheckCircle2, 
  Globe, Heart, Lock, HelpCircle, Phone, MapPin 
} from 'lucide-react';
import FAQSection from './FAQSection';

interface FooterProps {
  onSelectType?: (type: string) => void;
  onOpenAuth?: (role: 'landlord' | 'tenant') => void;
  onListPropertyClick?: () => void;
}

export default function Footer({ onSelectType, onOpenAuth, onListPropertyClick }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR (€)');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 500);
  };

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800 relative overflow-hidden mt-16">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* TOP SECTION: BRAND & NEWSLETTER CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 bg-slate-800/60 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-md">
          
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Building2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Rentora RealEstate</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
              The premier European rental marketplace connecting verified tenants with landlords. Integrated with Paystack Direct Payout API for real-time bank settlements.
            </p>
          </div>

          <div className="lg:col-span-6">
            {newsletterSubscribed ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 animate-fade-in">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Thank you for subscribing!</h4>
                  <p className="text-[11px] text-emerald-300 font-medium">You will receive weekly alerts for new verified listings and market insights.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Subscribe to Rental Market Alerts & New Properties
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address..."
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
        <FAQSection />

        {/* MIDDLE SECTION: CATEGORIZED NAVIGATION LINKS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-xs">
          
          {/* Col 1: Property Types */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Browse Types</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>
                <button onClick={() => onSelectType && onSelectType('apartment')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Apartments
                </button>
              </li>
              <li>
                <button onClick={() => onSelectType && onSelectType('studio')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Studios & Lofts
                </button>
              </li>
              <li>
                <button onClick={() => onSelectType && onSelectType('flat-share')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Shared Flats & Co-Living
                </button>
              </li>
              <li>
                <button onClick={() => onSelectType && onSelectType('room')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Single Private Rooms
                </button>
              </li>
              <li>
                <button onClick={() => onSelectType && onSelectType('house')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Townhouses & Villas
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Popular Locations */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Popular Cities</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Madrid (Sol & Chamberí)</span>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Barcelona (Eixample & Gràcia)</span>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Valencia (Beachfront & Ruzafa)</span>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Sevilla Historic Center</span>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Málaga Coast</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Landlord & Host Tools */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Host & Landlord</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>
                <button onClick={onListPropertyClick} className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-400 font-bold">
                  + List Your Property
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth && onOpenAuth('landlord')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Landlord Dashboard
                </button>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Paystack Direct Settlement</span>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                Rental Yield Estimator
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                AI Listing Optimizer
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Compliance */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Trust & Safety</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Paystack Escrow Guarantee</span>
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                Tenant Verification Standards
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                Lease Agreement Templates
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                Terms of Service
              </li>
              <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                Privacy Policy
              </li>
            </ul>
          </div>

          {/* Col 5: Security & Direct Gateway Callout */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payment Security</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              All rental transactions and landlord disbursements are powered by Paystack Direct API with 256-bit SSL encryption.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5">
              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                PAYSTACK VERIFIED
              </span>
              <span className="text-[9px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                NIBSS RESOLUTION
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR: COPYRIGHT, CURRENCY & LANGUAGE SELECTOR */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <span>© 2026 Rentora RealEstate Inc. All rights reserved.</span>
          </div>

          {/* Currency & Language Selectors */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="EUR (€)" className="bg-slate-900 text-white">EUR (€)</option>
                <option value="NGN (₦)" className="bg-slate-900 text-white">NGN (₦)</option>
                <option value="USD ($)" className="bg-slate-900 text-white">USD ($)</option>
                <option value="GBP (£)" className="bg-slate-900 text-white">GBP (£)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Built for modern renting</span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
