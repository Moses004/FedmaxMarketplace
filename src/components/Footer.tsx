import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Zap, Mail, ArrowRight, CheckCircle2, 
  Globe, Heart, Lock, HelpCircle, Phone, MapPin, X, FileText, 
  UserCheck, CreditCard, Scale, Clock, MessageSquare, Copy, Check,
  Twitter, Instagram, Linkedin, Facebook, ArrowUp, BadgeCheck, Headphones
} from 'lucide-react';
import FAQSection from './FAQSection';

import { SUPPORTED_CURRENCIES } from '../utils/currency';

interface FooterProps {
  onSelectType?: (type: string) => void;
  onOpenAuth?: (role: 'landlord' | 'tenant') => void;
  onListPropertyClick?: () => void;
  onSelectLocation?: (locationQuery: string) => void;
  onSelectArea?: (area: string) => void;
  onLanguageChange?: (langCode: string) => void;
  displayCurrency?: string;
  onCurrencyChange?: (currencyCode: string) => void;
}

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es', name: 'Español (Spain)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'yo', name: 'Yorùbá (Nigeria)', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa (Nigeria)', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo (Nigeria)', flag: '🇳🇬' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇦🇪' },
];

type PolicyModalType = 'escrow' | 'verification' | 'lease' | 'terms' | 'privacy' | 'contact' | null;

const REGIONAL_POPULAR_CITIES = [
  {
    country: 'Spain',
    flag: '🇪🇸',
    cities: [
      { name: 'Madrid', areas: ['Chamberí', 'Salamanca', 'Sol', 'Malasaña', 'Retiro'] },
      { name: 'Barcelona', areas: ['Eixample', 'Gràcia', 'Gòtic', 'Poblenou', 'Sarrià'] },
      { name: 'Valencia', areas: ['Ruzafa', 'El Carmen', 'Ciutat Vella', 'El Saler'] },
      { name: 'Sevilla', areas: ['Santa Cruz', 'Triana', 'Nervión', 'Macarena'] },
      { name: 'Málaga', areas: ['Centro Histórico', 'Malagueta', 'El Palo', 'Teatinos'] }
    ]
  },
  {
    country: 'Nigeria',
    flag: '🇳🇬',
    cities: [
      { name: 'Lagos', areas: ['Lekki Phase 1', 'Victoria Island', 'Ikeja GRA', 'Ikoyi', 'Surulere', 'Yaba'] },
      { name: 'Abuja (FCT)', areas: ['Maitama', 'Asokoro', 'Gwarinpa', 'Wuse II', 'Jabi', 'Kapo'] },
      { name: 'Port Harcourt', areas: ['GRA Phase 2', 'Trans Amadi', 'Ada George', 'Rumuola'] },
      { name: 'Ibadan', areas: ['Bodija', 'Ring Road', 'Agodi GRA', 'Iyaganku'] },
      { name: 'Calabar', areas: ['State Housing', 'Federal Housing', 'Etta Agbor', 'Marina'] }
    ]
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    cities: [
      { name: 'London', areas: ['Kensington', 'Shoreditch', 'Camden', 'Greenwich', 'Chelsea'] },
      { name: 'Manchester', areas: ['Northern Quarter', 'Ancoats', 'Didsbury', 'Salford Quays'] },
      { name: 'Birmingham', areas: ['Jewellery Quarter', 'Digbeth', 'Edgbaston', 'Moseley'] },
      { name: 'Edinburgh', areas: ['Old Town', 'Leith', 'New Town', 'Morningside'] }
    ]
  },
  {
    country: 'United States',
    flag: '🇺🇸',
    cities: [
      { name: 'New York', areas: ['Manhattan', 'Brooklyn Heights', 'Williamsburg', 'Astoria'] },
      { name: 'Los Angeles', areas: ['Santa Monica', 'Silver Lake', 'Beverly Hills', 'Downtown LA'] },
      { name: 'Miami', areas: ['Brickell', 'South Beach', 'Wynwood', 'Coconut Grove'] },
      { name: 'San Francisco', areas: ['Mission District', 'SoMa', 'Pacific Heights', 'Marina'] }
    ]
  },
  {
    country: 'UAE & Global',
    flag: '🇦🇪',
    cities: [
      { name: 'Dubai', areas: ['Dubai Marina', 'Downtown Dubai', 'JBR', 'Palm Jumeirah', 'Business Bay'] },
      { name: 'Berlin 🇩🇪', areas: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg'] },
      { name: 'Paris 🇫🇷', areas: ['Le Marais', 'Montmartre', 'Saint-Germain', 'Bastille'] }
    ]
  }
];

export default function Footer({ 
  onSelectType, 
  onOpenAuth, 
  onListPropertyClick, 
  onSelectLocation, 
  onSelectArea, 
  onLanguageChange,
  displayCurrency = 'USD',
  onCurrencyChange
}: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [languageToast, setLanguageToast] = useState<string | null>(null);
  const [activeRegionTab, setActiveRegionTab] = useState('Spain');
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyModalType>(null);
  const [copiedContact, setCopiedContact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    const matched = AVAILABLE_LANGUAGES.find(l => l.code === code);
    if (matched) {
      setLanguageToast(`Language changed to ${matched.name}`);
      setTimeout(() => setLanguageToast(null), 3000);
    }
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 500);
  };

  const handleCityOrAreaClick = (locationQuery: string, areaName?: string) => {
    if (areaName && onSelectArea) {
      onSelectArea(areaName);
    } else if (onSelectLocation) {
      onSelectLocation(locationQuery);
    }
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCopySupportEmail = () => {
    navigator.clipboard.writeText('support@rentora-realestate.com');
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2000);
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
              The premier global rental marketplace connecting verified tenants with landlords. Integrated with Paystack Direct Payout API for instant bank settlements and verified digital tenancy agreements.
            </p>
          </div>

          <div className="lg:col-span-6">
            {newsletterSubscribed ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 animate-fade-in">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Thank you for subscribing!</h4>
                  <p className="text-[11px] text-emerald-300 font-medium">You will receive instant alerts for new verified listings and market insights in your area.</p>
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

        {/* REGIONAL POPULAR CITIES & NEIGHBORHOOD QUICK LINK EXPLORER */}
        <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Explore Properties by Region, City & Neighborhood</span>
              </h3>
              <p className="text-[11px] text-slate-400">Click any city or neighborhood to filter available listings instantly.</p>
            </div>

            {/* Region Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 overflow-x-auto scrollbar-none">
              {REGIONAL_POPULAR_CITIES.map((reg) => (
                <button
                  key={reg.country}
                  type="button"
                  onClick={() => setActiveRegionTab(reg.country)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    activeRegionTab === reg.country
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="mr-1">{reg.flag}</span>
                  <span>{reg.country}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Region Cities Grid */}
          {(() => {
            const currentReg = REGIONAL_POPULAR_CITIES.find(r => r.country === activeRegionTab) || REGIONAL_POPULAR_CITIES[0];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {currentReg.cities.map((city) => (
                  <div key={city.name} className="space-y-1.5 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCityOrAreaClick(city.name)}
                      className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-between w-full text-left group cursor-pointer"
                    >
                      <span className="group-hover:underline">{city.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {city.areas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleCityOrAreaClick(`${city.name}, ${area}`, area)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-700/80 rounded-md text-[10px] font-medium transition-all cursor-pointer"
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* VERIFIED BY RENTORA TRUST BADGES SECTION */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl my-2">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white tracking-tight">Verified by Rentora™</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                      Trust Platform
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Triple-layer security and verification standards protecting every lease agreement and deposit payment.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trust Badge 1: Secure Payments */}
              <button
                type="button"
                onClick={() => setActivePolicyModal('escrow')}
                aria-label="View Rentora Secure Escrow Payments Guarantee"
                className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-300 text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    100% Protected
                  </span>
                </div>
                <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors mb-1">
                  Secure Escrow Payments
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Rental deposits and initial rent are securely held in regulated escrow accounts until physical key handover.
                </p>
              </button>

              {/* Trust Badge 2: 24/7 Global Support */}
              <button
                type="button"
                onClick={() => setActivePolicyModal('contact')}
                aria-label="Contact 24/7 Global Support Concierge"
                className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-300 text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                    24/7 Live
                  </span>
                </div>
                <h4 className="text-xs font-black text-white group-hover:text-teal-400 transition-colors mb-1">
                  24/7 Dedicated Support
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Round-the-clock dispute resolution, emergency relocation assistance, and multi-lingual helpdesk support.
                </p>
              </button>

              {/* Trust Badge 3: Verified Landlords */}
              <button
                type="button"
                onClick={() => setActivePolicyModal('verification')}
                aria-label="Learn about Verified Landlord Documentation"
                className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-300 text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Deeds Checked
                  </span>
                </div>
                <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors mb-1">
                  Verified Landlords & Deeds
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Every host identity, government ID, and property ownership deed is thoroughly verified before publishing.
                </p>
              </button>
            </div>
          </div>
        </div>

          {/* MIDDLE SECTION: CATEGORIZED MULTI-COLUMN NAVIGATION LINKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-xs pt-4">
            
            {/* Column 1: Company Info & Contact Snapshot */}
            <div className="space-y-3.5 sm:col-span-2 md:col-span-1">
              <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>About Rentora</span>
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Global rental platform empowering verified tenants and landlords with instant bank settlements, digital lease contracts, and zero-fraud guarantees.
              </p>
              <address className="not-italic text-slate-400 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Calle Gran Vía 28, Madrid / Victoria Island, Lagos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>+34 910 000 789 / +234 1 800 7368</span>
                </div>
              </address>

              {/* Social Media Profiles */}
              <div className="pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Connect With Rentora</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rentora on Twitter / X"
                    className="w-9 h-9 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 cursor-pointer group"
                  >
                    <Twitter className="w-4 h-4 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rentora on Instagram"
                    className="w-9 h-9 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/20 cursor-pointer group"
                  >
                    <Instagram className="w-4 h-4 group-hover:-rotate-6 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rentora on LinkedIn"
                    className="w-9 h-9 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer group"
                  >
                    <Linkedin className="w-4 h-4 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rentora on Facebook"
                    className="w-9 h-9 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer group"
                  >
                    <Facebook className="w-4 h-4 group-hover:-rotate-6 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Marketplace Navigation */}
            <nav aria-label="Explore Property Types Navigation" className="space-y-3.5">
              <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Explore Properties</span>
              </h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <button type="button" aria-label="Browse Apartments & Flats" onClick={() => onSelectType && onSelectType('apartment')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Apartments & Flats
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Browse Studios & Urban Lofts" onClick={() => onSelectType && onSelectType('studio')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Studios & Urban Lofts
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Browse Shared Co-Living Flats" onClick={() => onSelectType && onSelectType('flat-share')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Shared Co-Living Flats
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Browse Private Single Rooms" onClick={() => onSelectType && onSelectType('room')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Private Single Rooms
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Browse Villas & Luxury Homes" onClick={() => onSelectType && onSelectType('house')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Villas & Luxury Homes
                  </button>
                </li>
              </ul>
            </nav>

            {/* Column 3: Landlord & Host Portal */}
            <nav aria-label="Landlord & Host Resources Navigation" className="space-y-3.5">
              <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Host & Landlord</span>
              </h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <button type="button" aria-label="List Your Property on Rentora" onClick={onListPropertyClick} className="text-emerald-400 font-extrabold hover:text-emerald-300 transition-colors cursor-pointer text-left flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    <span>+ List Your Property</span>
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Sign in to Landlord Portal" onClick={() => onOpenAuth && onOpenAuth('landlord')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Landlord Portal Sign In
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Paystack Settlement Guide" onClick={() => setActivePolicyModal('escrow')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    <span>Paystack Settlement Guide</span>
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Tenant Verification Process" onClick={() => setActivePolicyModal('verification')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Tenant Verification Process
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Digital Tenancy Agreement Template" onClick={() => setActivePolicyModal('lease')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Digital Tenancy Agreement
                  </button>
                </li>
              </ul>
            </nav>

            {/* Column 4: Support & Help Resources */}
            <nav aria-label="Support & Help Resources Navigation" className="space-y-3.5">
              <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Support Resources</span>
              </h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <button type="button" aria-label="Open 24/7 Global Support Hub" onClick={() => setActivePolicyModal('contact')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    <Phone className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>24/7 Global Support Hub</span>
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Scroll to Frequently Asked Questions" onClick={() => {
                    const faqEl = document.getElementById('faq-section');
                    if (faqEl) faqEl.scrollIntoView({ behavior: 'smooth' });
                  }} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Frequently Asked Questions
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Payment and Refund Policy" onClick={() => setActivePolicyModal('escrow')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Payment & Refund Policy
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Safety and Tenant Screening Rules" onClick={() => setActivePolicyModal('verification')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Safety & Tenant Screening
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="Copy Support Email Address" onClick={handleCopySupportEmail} className="hover:text-emerald-400 cursor-pointer transition-colors text-left text-teal-400 font-semibold flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    <Mail className="w-3 h-3" />
                    <span>{copiedContact ? 'Email Copied!' : 'Email Helpdesk'}</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Column 5: Trust, Legal & Security Card */}
            <div className="space-y-3.5 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 shadow-md">
              <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trust & Compliance</span>
              </h4>
              <ul className="space-y-2 text-slate-400 font-medium text-[11px]">
                <li>
                  <button type="button" aria-label="View Escrow Payment Guarantee Policy" onClick={() => setActivePolicyModal('escrow')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Escrow Payment Guarantee</span>
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Terms of Service" onClick={() => setActivePolicyModal('terms')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button type="button" aria-label="View Privacy & GDPR Policy" onClick={() => setActivePolicyModal('privacy')} className="hover:text-emerald-400 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 -mx-1">
                    Privacy & GDPR Policy
                  </button>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-700/60 space-y-2">
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    PAYSTACK CERTIFIED
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                    256-BIT SSL
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Ask Support Team a Question"
                  onClick={() => setActivePolicyModal('contact')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask Support Team</span>
                </button>
              </div>
            </div>

          </div>

        {/* BOTTOM BAR: COPYRIGHT, CURRENCY & LANGUAGE SELECTOR */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <span>© 2026 Rentora RealEstate Inc. All rights reserved.</span>
          </div>

          {/* Social Media Links Bar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">Follow us:</span>
            <div className="flex items-center gap-1.5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Twitter / X"
                aria-label="Twitter / X"
                className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 hover:-translate-y-0.5 hover:scale-110 transition-all duration-200 ease-out group"
              >
                <Twitter className="w-4 h-4 group-hover:rotate-6 transition-transform duration-200" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                aria-label="Instagram"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 hover:-translate-y-0.5 hover:scale-110 transition-all duration-200 ease-out group"
              >
                <Instagram className="w-4 h-4 group-hover:-rotate-6 transition-transform duration-200" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                aria-label="LinkedIn"
                className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 hover:-translate-y-0.5 hover:scale-110 transition-all duration-200 ease-out group"
              >
                <Linkedin className="w-4 h-4 group-hover:rotate-6 transition-transform duration-200" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                aria-label="Facebook"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 hover:-translate-y-0.5 hover:scale-110 transition-all duration-200 ease-out group"
              >
                <Facebook className="w-4 h-4 group-hover:-rotate-6 transition-transform duration-200" />
              </a>
            </div>
          </div>

          {/* Language & Currency Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-bold transition-all relative">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                aria-label="Interface Language Switcher"
                value={selectedLanguage}
                onChange={(e) => handleLanguageSelect(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-slate-200 font-bold"
              >
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white font-medium py-1">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-bold transition-all">
              <span className="text-amber-400 font-extrabold">{SUPPORTED_CURRENCIES[displayCurrency]?.symbol || '$'}</span>
              <select
                aria-label="Display Currency Switcher"
                value={displayCurrency}
                onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-slate-200 font-bold"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-slate-900 text-white font-medium py-1">
                    {curr.flag} {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs font-medium pl-2">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Built for modern global renting</span>
            </div>

            {/* In-bar Back to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer group"
            >
              <ArrowUp className="w-3.5 h-3.5 text-emerald-400 group-hover:text-slate-950 transition-transform group-hover:-translate-y-0.5" />
              <span>Back to top</span>
            </button>
          </div>

        </div>

      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll back to top of page"
          title="Back to top"
          className={`fixed ${languageToast ? 'bottom-20' : 'bottom-6'} right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3 rounded-2xl shadow-2xl shadow-emerald-500/25 flex items-center gap-2 border border-emerald-300 transition-all duration-300 ease-out hover:scale-110 active:scale-95 cursor-pointer group animate-fade-in`}
        >
          <ArrowUp className="w-4 h-4 text-slate-950 group-hover:-translate-y-0.5 transition-transform" />
          <span className="hidden sm:inline font-black text-xs">Top</span>
        </button>
      )}

      {/* Floating Language Notification Toast */}
      {languageToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
          <span>{languageToast}</span>
        </div>
      )}

      {/* POLICY & LEGAL MODAL DIALOG */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {activePolicyModal === 'escrow' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Paystack Escrow & Direct Payout Guarantee</h3>
                    <p className="text-xs text-emerald-400 font-semibold">100% Risk-Free Rental Transactions</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium pt-2">
                  <p>
                    Rentora integrates with Paystack's certified payment gateway API to provide end-to-end security for both landlords and tenants.
                  </p>
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>How Tenant Escrow Protection Works:</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      <li>When a tenant books a property, rent and security deposit funds are placed into an isolated Paystack escrow account.</li>
                      <li>Funds are held until the landlord approves the booking request and key handover terms are confirmed.</li>
                      <li>If the landlord declines or the request expires after 48 hours, rent is automatically refunded directly to the tenant's card or bank account.</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Direct NIBSS & Bank Settlement for Landlords:</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      <li>Upon tenancy activation, payouts are settled straight to the landlord's registered bank account.</li>
                      <li>Includes automated payment reference logs and downloadable tax/revenue receipts in the Landlord Dashboard.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activePolicyModal === 'verification' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Tenant Screening & Verification Standards</h3>
                    <p className="text-xs text-teal-400 font-semibold">Ensuring Qualified & Trustworthy Tenants</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium pt-2">
                  <p>
                    Every tenant profile on Rentora goes through a rigorous multi-tier identity and background verification pipeline before requesting a booking:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <h4 className="font-bold text-white text-xs mb-1">Government ID Check</h4>
                      <p className="text-[11px] text-slate-400">Passport, National Identity Number (NIN/DNI), or Driver’s License validation.</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <h4 className="font-bold text-white text-xs mb-1">Income & Work Status</h4>
                      <p className="text-[11px] text-slate-400">Payslip or bank statement proof confirming 2.5x monthly rent coverage ratio.</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <h4 className="font-bold text-white text-xs mb-1">Rental History</h4>
                      <p className="text-[11px] text-slate-400">Previous landlord recommendations and digital verification badges.</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <h4 className="font-bold text-white text-xs mb-1">Zero Scam Policy</h4>
                      <p className="text-[11px] text-slate-400">Flagged profiles are instantly blacklisted across our global database.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePolicyModal === 'lease' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Digital Tenancy Agreements & Legal Compliance</h3>
                    <p className="text-xs text-sky-400 font-semibold">Legally Binding Digital Contracts</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium pt-2">
                  <p>
                    Rentora generates localized digital lease agreements customized according to regional housing laws (e.g. LAU in Spain, Tenancy Act in Nigeria, Housing Act in UK).
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                    <li>Automated inclusions of move-in date, monthly rental fee, utility billing responsibilities, and security deposit clauses.</li>
                    <li>Digital e-signatures for both landlord and tenant stored securely with immutable timestamp audits.</li>
                    <li>Downloadable PDF contracts available inside the Bookings Hub.</li>
                  </ul>
                </div>
              </div>
            )}

            {(activePolicyModal === 'terms' || activePolicyModal === 'privacy') && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      {activePolicyModal === 'terms' ? 'Terms of Service' : 'Privacy & Data Policy'}
                    </h3>
                    <p className="text-xs text-emerald-400 font-semibold">GDPR & Global Compliance Standard</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium pt-2">
                  <p>
                    {activePolicyModal === 'terms'
                      ? 'By accessing or using Rentora RealEstate, you agree to abide by our global platform terms, fair housing policies, and secure booking guidelines. Fraudulent listings or deceptive property descriptions are strictly prohibited.'
                      : 'We respect your personal privacy. Your payment details are processed directly by certified payment processors (Paystack/SSL 256-Bit) and are never stored in plaintext on our servers. You retain full right to request data deletion at any time.'}
                  </p>
                </div>
              </div>
            )}

            {activePolicyModal === 'contact' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Rentora 24/7 Global Support & Helpdesk</h3>
                    <p className="text-xs text-teal-400 font-semibold">We are here to assist landlords and tenants anytime</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium pt-2">
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Customer Support Email:</span>
                      <button
                        onClick={handleCopySupportEmail}
                        className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {copiedContact ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedContact ? 'Copied!' : 'support@rentora-realestate.com'}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Emergency Hotline:</span>
                      <span className="font-bold text-white">+34 910 000 789 / +234 1 800 7368</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Live Assistance Hours:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 24 Hours / 7 Days a week
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Got it, close modal
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}

