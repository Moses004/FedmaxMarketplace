import React, { useState } from 'react';
import { Sparkles, Zap, ShieldCheck, ArrowRight, X, Building2, CheckCircle2 } from 'lucide-react';

interface PromotionalBannerProps {
  onListPropertyClick: () => void;
  onExploreClick: () => void;
}

export default function PromotionalBanner({ onListPropertyClick, onExploreClick }: PromotionalBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl border border-emerald-900/60 p-6 sm:p-8 lg:p-10">
        
        {/* Subtle background decorative shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-full transition-all cursor-pointer z-10"
          title="Dismiss promotional banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-1">
          
          {/* Main Value Proposition Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span>Next-Gen Rental Marketplace</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              List Your Property with <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Paystack Hosted Direct Settlement</span>
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
              Join thousands of landlords experiencing instant bank payouts, automated NIBSS account verification, zero listing fees, and AI-powered rental description generation.
            </p>

            {/* Feature Highlights Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 fill-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant Payouts</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Direct Bank API</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Verified Tenants</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Screened Identity</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Optimization</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Maximized Yield</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={onListPropertyClick}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>List Your Property Free</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={onExploreClick}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
              >
                Explore Verified Homes
              </button>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl border border-white/15 p-5 sm:p-6 space-y-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Landlord Payout Hub</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                PAYSTACK READY
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Monthly Rental Earnings</span>
                  <span className="text-lg font-mono font-black text-white">€3,450.00</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Settled</span>
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Paystack Direct Gateway</span>
                  <span className="text-xs font-bold text-slate-200">Guaranty Trust Bank (058)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  Verified
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 text-center font-medium italic pt-1">
              "Withdrawals are processed directly through Paystack API for zero-delay bank transfers."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
