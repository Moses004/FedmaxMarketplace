import React, { useEffect, useState } from 'react';
import { Listing } from '../types';
import { 
  updateSEOMetadata, 
  buildListingSEOMetadata, 
  buildSearchSEOMetadata,
  SEOMetadataOptions
} from '../services/seoService';
import { Globe, Code, ExternalLink, CheckCircle2, Sparkles, Copy, Eye, X, ChevronRight, Share2, Tag, FileText } from 'lucide-react';

interface SEOMetadataManagerProps {
  currentTab: string;
  selectedListing: Listing | null;
  filteredCount: number;
  searchQuery?: string;
  selectedType?: string;
  selectedLocationName?: string;
  currencySymbol?: string;
  topListings?: Listing[];
  showInspectorTrigger?: boolean;
  hasCompareBar?: boolean;
}

export const SEOMetadataManager: React.FC<SEOMetadataManagerProps> = ({
  currentTab,
  selectedListing,
  filteredCount,
  searchQuery,
  selectedType,
  selectedLocationName,
  currencySymbol = '$',
  topListings = [],
  showInspectorTrigger = true,
  hasCompareBar = false
}) => {
  const [activeMetadata, setActiveMetadata] = useState<SEOMetadataOptions>({});
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync document title and meta tags on every context change
  useEffect(() => {
    let options: SEOMetadataOptions = {};

    if (selectedListing) {
      // 1. Single Property Listing Mode
      options = buildListingSEOMetadata(selectedListing, currencySymbol);
    } else if (currentTab === 'explore') {
      // 2. Search & Marketplace Catalog Mode
      options = buildSearchSEOMetadata({
        resultCount: filteredCount,
        searchQuery,
        categoryLabel: selectedType && selectedType !== 'all' ? selectedType.replace(/-/g, ' ') : undefined,
        locationName: selectedLocationName,
        topListings,
        currencySymbol
      });
    } else if (currentTab === 'favorites') {
      options = {
        title: `My Saved Favorite Properties (${filteredCount}) | Rentora RealEstate`,
        description: `View your saved bookmark properties and monitor price drops on Rentora RealEstate marketplace.`,
        ogType: 'website'
      };
    } else if (currentTab === 'dashboard') {
      options = {
        title: `Landlord & Property Management Dashboard | Rentora RealEstate`,
        description: `Manage listings, view tenant rental applications, process direct payouts, and handle leases on Rentora.`,
        ogType: 'website'
      };
    } else if (currentTab === 'my-bookings') {
      options = {
        title: `My Rental Applications & Active Leases | Rentora RealEstate`,
        description: `Track rental application statuses, schedule viewing tours, and review digital tenancy agreements.`,
        ogType: 'website'
      };
    } else if (currentTab === 'saved-searches') {
      options = {
        title: `Saved Property Search Alerts | Rentora RealEstate`,
        description: `Receive instant notifications and email alerts when new matching rentals are listed on Rentora.`,
        ogType: 'website'
      };
    } else if (currentTab === 'messages') {
      options = {
        title: `Tenant & Landlord Direct Messages | Rentora RealEstate`,
        description: `Secure end-to-end encrypted messaging with verified landlords and property managers.`,
        ogType: 'website'
      };
    } else {
      options = {
        title: `Rentora RealEstate | Verified Property Rentals & Marketplace`,
        description: `Find luxury apartments, long-term rentals, studio flats, and verified homes with instant online lease verification.`,
        ogType: 'website'
      };
    }

    // Apply metadata changes dynamically to document head
    updateSEOMetadata(options);
    setActiveMetadata(options);
  }, [currentTab, selectedListing, filteredCount, searchQuery, selectedType, selectedLocationName, currencySymbol, topListings]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      {/* Floating SEO Metadata Inspector Toggle Badge for dev/management inspection */}
      {showInspectorTrigger && (
        <div className="fixed top-20 left-3 md:top-auto md:bottom-6 md:right-6 md:left-auto z-30 pointer-events-auto transition-all">
          <button
            type="button"
            onClick={() => setShowInspectorModal(true)}
            className="group bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-900 text-slate-200 hover:text-white px-3 py-2 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2 text-[11px] font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Inspect Live Page SEO Title, Meta Tags & Schema.org JSON-LD"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Globe className="w-3 h-3" />
            </div>
            <span className="hidden sm:inline font-bold">SEO Head</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-mono border border-emerald-500/30">
              Live
            </span>
          </button>
        </div>
      )}

      {/* SEO METADATA INSPECTOR & SCHEMA VALIDATOR MODAL */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe modal-scroll-area animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    SEO Metadata Manager
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                      Real-Time Indexing
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live HTML head preview, Open Graph cards, and JSON-LD structured schemas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInspectorModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 modal-scroll-area text-xs">
              
              {/* Google Search Result Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    Google Search Result Preview
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {activeMetadata.title?.length || 0} chars title
                  </span>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 font-sans">
                  <div className="text-[11px] text-emerald-400 truncate flex items-center gap-1 font-mono">
                    <span>https://rentora-realestate.com</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-slate-400 truncate">
                      {selectedListing ? `listing/${selectedListing.id}` : currentTab}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-blue-400 hover:underline cursor-pointer leading-tight">
                    {activeMetadata.title || document.title}
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                    {activeMetadata.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Live Meta Tags Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  Active Head Meta Attributes
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  
                  {/* Title */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-0.5">
                        &lt;title&gt;
                      </span>
                      <p className="font-medium text-slate-200 break-words">
                        {activeMetadata.title}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeMetadata.title || '', 'title')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
                    >
                      {copiedKey === 'title' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Description */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-0.5">
                        &lt;meta name="description"&gt;
                      </span>
                      <p className="font-normal text-slate-300 break-words leading-relaxed">
                        {activeMetadata.description}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeMetadata.description || '', 'desc')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
                    >
                      {copiedKey === 'desc' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* OpenGraph / Social Image Card */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                      &lt;meta property="og:image"&gt; &amp; Social Card Preview
                    </span>
                    <div className="flex items-center gap-3">
                      <img 
                        src={activeMetadata.ogImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80'} 
                        alt="SEO Social Share Preview" 
                        className="w-20 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-slate-200 block truncate">
                          {activeMetadata.title}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {activeMetadata.ogImage}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* JSON-LD Structured Data Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    Schema.org JSON-LD Structured Data
                  </h4>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(activeMetadata.jsonLd || {}, null, 2), 'jsonld')}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    {copiedKey === 'jsonld' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Schema
                  </button>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  <pre>{JSON.stringify(activeMetadata.jsonLd || { "@context": "https://schema.org", "@type": "WebSite" }, null, 2)}</pre>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Dynamic SEO Active
              </span>
              <button
                type="button"
                onClick={() => setShowInspectorModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
