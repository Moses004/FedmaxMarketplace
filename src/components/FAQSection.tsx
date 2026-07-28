import React, { useState } from 'react';
import { 
  ChevronDown, Search, HelpCircle, ShieldCheck, Zap, 
  Building2, Users, CheckCircle2, MessageSquare, CreditCard 
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'landlord' | 'tenant' | 'payouts';
  categoryLabel: string;
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'payout-1',
    category: 'payouts',
    categoryLabel: 'Paystack Payouts',
    question: 'How do I receive rental earnings using Paystack Hosted Direct API?',
    answer: 'Landlords can select their commercial bank (e.g., Guaranty Trust Bank, Zenith, Access, Kuda), enter their account number, and click "Resolve Account Name". Our direct Paystack API verifies beneficiary details instantly with NIBSS. Once verified, click "Withdraw Earnings" to receive real-time direct bank settlements with live transfer reference tracking.',
    badge: 'Direct Bank API'
  },
  {
    id: 'payout-2',
    category: 'payouts',
    categoryLabel: 'Paystack Payouts',
    question: 'How long does a landlord withdrawal take to reach my bank account?',
    answer: 'Withdrawals are processed instantly in real time via our Paystack Direct API integration. In 99% of cases, funds land in your commercial bank account within 10 to 30 seconds after clicking "Confirm Disbursement". You also receive a Paystack transfer reference code (e.g. TRF_982410582910) for instant tracking.',
    badge: 'Instant Settlement'
  },
  {
    id: 'payout-3',
    category: 'payouts',
    categoryLabel: 'Paystack Payouts',
    question: 'What are the fees for landlord payouts and bank disbursements?',
    answer: 'Rentora RealEstate covers all Paystack API transfer and NIBSS interbank processing fees for landlord withdrawals. There are 0% hidden withdrawal charges — 100% of your requested rental income goes directly into your bank account.',
    badge: '0% Payout Fee'
  },
  {
    id: 'payout-4',
    category: 'payouts',
    categoryLabel: 'Paystack Payouts',
    question: 'Which commercial banks are supported for landlord payouts?',
    answer: 'We support all CBN-licensed commercial banks and microfinance institutions in Nigeria including GTBank, Zenith, Access Bank, First Bank, UBA, Stanbic IBTC, Kuda Microfinance Bank, OPay, Palmpay, and 50+ other financial institutions listed via our Paystack Bank list API.',
    badge: '50+ Banks'
  },
  {
    id: 'payout-5',
    category: 'payouts',
    categoryLabel: 'Paystack Payouts',
    question: 'What happens if a bank transfer or withdrawal fails?',
    answer: 'If a destination bank experiences temporary downtime, the Paystack API automatically flags the transaction status and instantly returns the funds to your Rentora RealEstate Available Earnings balance. You can re-try or update your account details immediately without losing any money.',
    badge: 'Fail-Safe Protection'
  },
  {
    id: 'landlord-1',
    category: 'landlord',
    categoryLabel: 'For Landlords',
    question: 'How much does it cost to list a property on Rentora RealEstate?',
    answer: 'Listing your property on Rentora RealEstate is 100% free with zero upfront or monthly subscription fees. We only charge a minimal 1.5% processing fee on completed rental transactions, allowing you to maximize rental yield.',
    badge: 'Free Listing'
  },
  {
    id: 'landlord-2',
    category: 'landlord',
    categoryLabel: 'For Landlords',
    question: 'How does tenant background & identity verification work?',
    answer: 'Every prospective tenant undergoes identity screening, employment status verification, and reference check validation before submitting rental applications. Landlords can review full tenant profiles, credit check indicators, and verified employer references inside the Landlord Dashboard.',
    badge: 'Tenant Screening'
  },
  {
    id: 'landlord-3',
    category: 'landlord',
    categoryLabel: 'For Landlords',
    question: 'Can I set up automated recurring payouts for rental income?',
    answer: 'Yes! In the Landlord Payout Hub, you can toggle "Automated Payouts" and choose your preferred frequency (weekly or monthly). When rent payments settle into your account, Paystack API automatically triggers direct bank disbursement to your linked account.',
    badge: 'Auto-Settlement'
  },
  {
    id: 'tenant-1',
    category: 'tenant',
    categoryLabel: 'For Tenants',
    question: 'Are my rental payments and security deposits safe?',
    answer: 'Yes. All payments are securely processed through Paystack Escrow Protection. Your funds are held safely until you inspect the property and confirm check-in approval, protecting you against fraudulent listings or misrepresentation.',
    badge: 'Paystack Escrow'
  },
  {
    id: 'tenant-2',
    category: 'tenant',
    categoryLabel: 'For Tenants',
    question: 'How do I book a physical or virtual property viewing?',
    answer: 'Simply click on any property card to open the Property Details drawer. Select "Schedule Viewing", pick your preferred date and time slot, and submit. The landlord will confirm your appointment instantly or provide a virtual video walkthrough link.',
    badge: 'Easy Booking'
  },
  {
    id: 'tenant-3',
    category: 'tenant',
    categoryLabel: 'For Tenants',
    question: 'What happens if the property does not match the online listing?',
    answer: 'Under our 48-Hour Check-In Money-Back Guarantee, if the property differs substantially from the verified listing photos or description, report it within 48 hours of check-in to receive a 100% full refund from Paystack escrow.',
    badge: 'Refund Guarantee'
  }
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'landlord' | 'tenant' | 'payouts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>('payout-1');

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="p-6 sm:p-8 bg-slate-800/80 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-6">
      
      {/* FAQ Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Frequently Asked Questions
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Common Questions for Landlords & Tenants
          </h3>
          <p className="text-xs text-slate-300 font-medium">
            Learn more about property listings, Paystack Direct API withdrawals, tenant screening, and safety guarantees.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Questions', icon: HelpCircle },
          { id: 'payouts', label: 'Paystack Payouts', icon: Zap },
          { id: 'landlord', label: 'For Landlords', icon: Building2 },
          { id: 'tenant', label: 'For Tenants', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-700/60 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-xs font-bold text-white">No questions matching your search</h4>
            <p className="text-[11px] text-slate-400">Try searching for terms like "Paystack", "deposit", "listing", or "payout".</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg'
                    : 'bg-slate-900/50 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {faq.question}
                    </span>
                    {faq.badge && (
                      <span className="hidden sm:inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md shrink-0">
                        {faq.badge}
                      </span>
                    )}
                  </div>
                  <div className={`p-1 rounded-lg bg-slate-800 text-slate-300 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-emerald-400 bg-emerald-500/20' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 font-medium leading-relaxed border-t border-slate-800/80 animate-fade-in space-y-2">
                    <p>{faq.answer}</p>
                    <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified Rentora RealEstate Platform Standard</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Support Contact Footer Prompt */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40">
        <div className="flex items-center gap-2 text-slate-300">
          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">Have more questions about Paystack bank transfers or tenant bookings?</span>
        </div>
        <a
          href="mailto:support@rentora.com"
          className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition-all shrink-0"
        >
          Contact Support Team
        </a>
      </div>

    </section>
  );
}
