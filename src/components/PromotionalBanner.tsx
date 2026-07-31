import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Zap, ShieldCheck, ArrowRight, X, Building2, CheckCircle2, 
  ChevronLeft, ChevronRight, Play, Pause, Globe, BadgeCheck, FileText, 
  MapPin, Coins, Headphones, BarChart3, Lock, RefreshCw, Compass
} from 'lucide-react';

interface PromotionalBannerProps {
  onListPropertyClick: () => void;
  onExploreClick: () => void;
}

interface BannerSlide {
  id: string;
  category: string;
  badgeIcon: React.ElementType;
  badgeColor: string;
  title: string;
  highlightText: string;
  description: string;
  keyHighlights: {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
  }[];
  primaryActionLabel: string;
  primaryActionType: 'list' | 'explore';
  secondaryActionLabel: string;
  secondaryActionType: 'list' | 'explore';
  heroCardType: 'paystack' | 'escrow' | 'neighborhood' | 'currency';
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'paystack_payouts',
    category: 'NEW FEATURE • LANDLORD TECH',
    badgeIcon: Zap,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    title: 'List Your Property with',
    highlightText: 'Paystack Direct Bank Settlement',
    description: 'Experience instant automated bank payouts, zero listing fees, automated NIBSS account verification, and AI-powered rental yield optimization.',
    keyHighlights: [
      {
        icon: Zap,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        title: 'Instant Payouts',
        subtitle: 'Direct Bank API',
      },
      {
        icon: ShieldCheck,
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
        title: 'Verified Tenants',
        subtitle: 'Screened ID Checks',
      },
      {
        icon: Building2,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-300',
        title: 'AI Valuation',
        subtitle: 'Maximized Yield',
      },
    ],
    primaryActionLabel: 'List Your Property Free',
    primaryActionType: 'list',
    secondaryActionLabel: 'Explore Verified Homes',
    secondaryActionType: 'explore',
    heroCardType: 'paystack',
  },
  {
    id: 'escrow_protection',
    category: 'SECURITY • RENTORA SHIELD™',
    badgeIcon: Lock,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    title: '100% Regulated Escrow',
    highlightText: 'Deposit Protection & Smart Leases',
    description: 'Rental deposits and first month payments are safely held in regulated escrow accounts until physical key handover, backed by legally binding digital lease contracts.',
    keyHighlights: [
      {
        icon: Lock,
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
        title: '100% Protection',
        subtitle: 'Regulated Vault',
      },
      {
        icon: FileText,
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        title: 'Digital Leases',
        subtitle: '1-Click Signing',
      },
      {
        icon: BadgeCheck,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-300',
        title: 'Deed Verified',
        subtitle: 'Anti-Fraud Shield',
      },
    ],
    primaryActionLabel: 'Explore Escrow Guarded Rentals',
    primaryActionType: 'explore',
    secondaryActionLabel: 'Become a Host',
    secondaryActionType: 'list',
    heroCardType: 'escrow',
  },
  {
    id: 'neighborhood_ai',
    category: 'EXPLORE TECH • WALK SCORE 2.0',
    badgeIcon: MapPin,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    title: 'Discover Neighborhoods with',
    highlightText: 'Real-Time AI Location Guides',
    description: 'Instantly evaluate walkability scores, nearby public transit lines, top school ratings, local crime indices, and top cafes before booking your first physical viewing.',
    keyHighlights: [
      {
        icon: MapPin,
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400',
        title: 'Walk Score 95+',
        subtitle: 'Transit Paradise',
      },
      {
        icon: Compass,
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-300',
        title: 'GPS Radius',
        subtitle: 'Distance Filter',
      },
      {
        icon: Headphones,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-300',
        title: '24/7 Support',
        subtitle: 'Concierge Help',
      },
    ],
    primaryActionLabel: 'Explore Neighborhood Map',
    primaryActionType: 'explore',
    secondaryActionLabel: 'List Property in My City',
    secondaryActionType: 'list',
    heroCardType: 'neighborhood',
  },
  {
    id: 'multi_currency_fx',
    category: 'GLOBAL MARKET • REAL-TIME FX',
    badgeIcon: Coins,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: 'Cross-Border Renting with',
    highlightText: 'Live Multi-Currency Conversion',
    description: 'Seamlessly switch rental prices across EUR, USD, GBP, NGN, KES, and AED with bank-grade live foreign exchange rates and country-specific location scoping.',
    keyHighlights: [
      {
        icon: Coins,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-300',
        title: '6 Global Currencies',
        subtitle: 'Live FX Rates',
      },
      {
        icon: Globe,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        title: 'Global Markets',
        subtitle: 'Spain, UK, NG, UAE',
      },
      {
        icon: BarChart3,
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-300',
        title: 'Yield Analytics',
        subtitle: 'Transparent Rates',
      },
    ],
    primaryActionLabel: 'Explore Global Listings',
    primaryActionType: 'explore',
    secondaryActionLabel: 'List International Rental',
    secondaryActionType: 'list',
    heroCardType: 'currency',
  },
];

export default function PromotionalBanner({ onListPropertyClick, onExploreClick }: PromotionalBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const SLIDE_DURATION_MS = 6000;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance logic
  useEffect(() => {
    if (isDismissed || !isPlaying) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    setProgress(0);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(currentProgress);

      if (elapsed >= SLIDE_DURATION_MS) {
        setCurrentSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentSlideIndex, isPlaying, isDismissed]);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? BANNER_SLIDES.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    setProgress(0);
  };

  const handleJumpToSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setProgress(0);
  };

  if (isDismissed) return null;

  const currentSlide = BANNER_SLIDES[currentSlideIndex];
  const BadgeIcon = currentSlide.badgeIcon;

  return (
    <section 
      aria-label="Platform Updates and Promotional Announcements"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 animate-fade-in"
    >
      <div 
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl border border-emerald-900/60 p-6 sm:p-8 lg:p-10 transition-all duration-500"
      >
        
        {/* Dynamic Background Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700" />

        {/* Top Header Bar: Slide Filter Tabs & Dismiss Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6 relative z-10">
          
          {/* Activity Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mr-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Platform Updates:</span>
            </span>

            {BANNER_SLIDES.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => handleJumpToSlide(idx)}
                  aria-label={`Jump to ${slide.category} feature update`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-950 animate-ping' : 'bg-slate-500'}`} />
                  <span>{slide.id === 'paystack_payouts' ? 'Landlord Payouts' : slide.id === 'escrow_protection' ? 'Escrow Shield' : slide.id === 'neighborhood_ai' ? 'WalkScore AI' : 'Global FX'}</span>
                </button>
              );
            })}
          </div>

          {/* Banner Controls: Play/Pause, Next/Prev, Dismiss */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause banner auto-rotation" : "Play banner auto-rotation"}
              title={isPlaying ? "Pause auto-scroll" : "Play auto-scroll"}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl border border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous platform update feature"
              title="Previous feature"
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl border border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next platform update feature"
              title="Next feature"
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl border border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-5 bg-white/15 mx-0.5" />

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss platform update banner"
              title="Dismiss banner"
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl border border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Main Slide Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Main Value Proposition Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Category Tag */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wider ${currentSlide.badgeColor}`}>
              <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{currentSlide.category}</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {currentSlide.title}{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                {currentSlide.highlightText}
              </span>
            </h2>

            {/* Sub-description */}
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
              {currentSlide.description}
            </p>

            {/* Key Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {currentSlide.keyHighlights.map((hl, i) => {
                const HlIcon = hl.icon;
                return (
                  <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 hover:bg-white/10 transition-colors">
                    <div className={`w-8 h-8 rounded-xl ${hl.iconBg} ${hl.iconColor} flex items-center justify-center shrink-0`}>
                      <HlIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{hl.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{hl.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={currentSlide.primaryActionType === 'list' ? onListPropertyClick : onExploreClick}
                aria-label={currentSlide.primaryActionLabel}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span>{currentSlide.primaryActionLabel}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={currentSlide.secondaryActionType === 'list' ? onListPropertyClick : onExploreClick}
                aria-label={currentSlide.secondaryActionLabel}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {currentSlide.secondaryActionLabel}
              </button>
            </div>

          </div>

          {/* Right Column: Dynamic Interactive Feature Preview Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl border border-white/15 p-5 sm:p-6 space-y-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* HERO CARD TYPE 1: PAYSTACK LANDLORD HUB */}
            {currentSlide.heroCardType === 'paystack' && (
              <div className="space-y-4 animate-fade-in">
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
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Monthly Rental Earnings</span>
                      <span className="text-lg font-mono font-black text-white">€3,450.00</span>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Settled</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Paystack Direct Gateway</span>
                      <span className="text-xs font-bold text-slate-200">Guaranty Trust Bank (058)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      Verified NIBSS
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 text-center font-medium italic pt-1">
                  "Withdrawals process directly through Paystack API for zero-delay bank transfers."
                </p>
              </div>
            )}

            {/* HERO CARD TYPE 2: RENTORA SHIELD ESCROW */}
            {currentSlide.heroCardType === 'escrow' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Escrow Vault Shield</span>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30 font-bold">
                    100% REGULATED
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-teal-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-teal-400 block uppercase font-bold">Held in Escrow Vault</span>
                      <span className="text-lg font-mono font-black text-white">€1,200.00</span>
                    </div>
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-lg font-bold border border-teal-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Protected</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Digital Lease Agreement</span>
                      <span className="text-xs font-bold text-slate-200">Standard EU Tenancy Deed</span>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono font-bold">
                      Signed & Locked
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-teal-200/90 text-center font-medium italic pt-1">
                  "Funds are only released to the landlord after physical key delivery."
                </p>
              </div>
            )}

            {/* HERO CARD TYPE 3: NEIGHBORHOOD WALK SCORE */}
            {currentSlide.heroCardType === 'neighborhood' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">WalkScore Intelligence</span>
                  </div>
                  <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30 font-bold">
                    LIVE REPORT
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Walkability Rating</span>
                      <span className="text-lg font-mono font-black text-sky-400">95 / 100</span>
                    </div>
                    <span className="text-xs bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-lg font-bold border border-sky-500/30">
                      Walker's Paradise
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/10 text-center">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Nearest Metro</span>
                      <span className="text-xs font-bold text-white">2 Mins Walk</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/10 text-center">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Safety Score</span>
                      <span className="text-xs font-bold text-emerald-400">Grade A+</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-sky-200/90 text-center font-medium italic pt-1">
                  "Calculated in real-time using municipal transit APIs and school district data."
                </p>
              </div>
            )}

            {/* HERO CARD TYPE 4: MULTI-CURRENCY FX ENGINE */}
            {currentSlide.heroCardType === 'currency' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Multi-Currency Converter</span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                    LIVE FX ENGINE
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">EUR (€) Base Rate</span>
                    <span className="font-mono font-black text-emerald-400">€1,200 / mo</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">USD ($) Equivalent</span>
                    <span className="font-mono font-bold text-sky-300">$1,310 / mo</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">NGN (₦) Equivalent</span>
                    <span className="font-mono font-bold text-amber-300">₦2,100,000 / mo</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-200/90 text-center font-medium italic pt-1">
                  "Auto-converts prices based on your preferred local wallet currency."
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Slide Progress Bar & Index Indicators */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between gap-4 relative z-10">
          
          {/* Progress Bar Container */}
          <div className="flex-1 max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {BANNER_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleJumpToSlide(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlideIndex 
                    ? 'w-6 bg-emerald-400' 
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Active Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Activity Feed Live</span>
          </div>

        </div>

      </div>
    </section>
  );
}
