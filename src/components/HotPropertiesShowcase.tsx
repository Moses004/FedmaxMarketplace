import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';
import { 
  Flame, Sparkles, ShieldCheck, Zap, Play, Pause, ChevronLeft, ChevronRight, 
  MapPin, Bed, Bath, Maximize, Eye, Calendar, Heart, ArrowRight, Video, 
  Share2, Compass, Layers, CheckCircle2, TrendingUp, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PropertyStatusBadge from './PropertyStatusBadge';
import { getListingPrices } from '../utils/currency';
import PropertyMap from './PropertyMap';

interface HotPropertiesShowcaseProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  favorites?: string[];
  onToggleFavorite?: (e: React.MouseEvent, listingId: string) => void;
  onBookTour?: (listing: Listing) => void;
  displayCurrency?: string;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
}

type ShowcaseTab = 'hot' | 'new' | 'luxury' | 'instant';
type ViewMode = 'showcase' | 'map';

export default function HotPropertiesShowcase({
  listings,
  selectedListing,
  onSelectListing,
  favorites = [],
  onToggleFavorite,
  onBookTour,
  displayCurrency = 'regional',
  mapCenter = { lat: 40.4167, lng: -3.7037 },
  mapZoom = 13,
}: HotPropertiesShowcaseProps) {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('hot');
  const [viewMode, setViewMode] = useState<ViewMode>('showcase');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Filter listings based on active tab
  const getFilteredListings = (): Listing[] => {
    if (!listings || listings.length === 0) return [];
    
    switch (activeTab) {
      case 'hot':
        // High demand, penthouses, apartments, or featured
        return [...listings].sort((a, b) => b.price - a.price);
      case 'new':
        // Listings with status 'new' or top array items
        return listings.filter(l => l.status === 'new' || l.status === 'available');
      case 'luxury':
        return listings.filter(l => 
          l.type === 'penthouse' || l.type === 'villa' || l.type === 'duplex' || l.price > 1200
        );
      case 'instant':
        return listings.filter(l => l.status === 'available' || l.status === 'new');
      default:
        return listings;
    }
  };

  const showcaseListings = getFilteredListings();
  const currentListing = showcaseListings[activeIndex] || showcaseListings[0] || listings[0];

  // Auto-advance timer logic (cycles every 6 seconds)
  useEffect(() => {
    if (!isPlaying || showcaseListings.length <= 1) {
      setProgress(0);
      return;
    }

    const intervalTime = 50; // Update progress bar every 50ms
    const totalTime = 6000; // 6 seconds total per property
    const increment = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next listing
          setActiveIndex((current) => (current + 1) % showcaseListings.length);
          setActiveImageIndex(0);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, showcaseListings.length, activeIndex]);

  // Sync selected listing if changed externally
  useEffect(() => {
    if (selectedListing) {
      const index = showcaseListings.findIndex(l => l.id === selectedListing.id);
      if (index !== -1) {
        setActiveIndex(index);
        setActiveImageIndex(0);
      }
    }
  }, [selectedListing]);

  // Reset active index when changing tabs
  const handleTabChange = (tab: ShowcaseTab) => {
    setActiveTab(tab);
    setActiveIndex(0);
    setActiveImageIndex(0);
    setProgress(0);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % showcaseListings.length);
    setActiveImageIndex(0);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + showcaseListings.length) % showcaseListings.length);
    setActiveImageIndex(0);
    setProgress(0);
  };

  if (!currentListing) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl text-center">
        <Sparkles className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold">No Showcase Properties Available</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">Adjust your search filters to explore hot available residences.</p>
      </div>
    );
  }

  const { primaryFormatted, secondaryFormatted, periodLabel, monthlyEquivalentText } = getListingPrices(currentListing, displayCurrency);
  const images = currentListing.images && currentListing.images.length > 0
    ? currentListing.images
    : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'];

  const isFavorited = favorites.includes(currentListing.id);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative select-none">
      
      {/* HEADER BAR: Showcase Mode Controls & Sub-tabs */}
      <div className="bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        
        {/* Left Title & Live Pulse Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-md">
            <Flame className="w-4 h-4 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <h3 className="font-display font-black text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Hot & New Properties Reel</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded-md hidden xs:inline-block">
                LIVE STREAM
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 hidden sm:block">Dynamic spotlight of available verified residences</p>
          </div>
        </div>

        {/* Center / Right Mode Switcher (Showcase Reel vs Map View) */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'showcase'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[11px]">Showcase Reel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[11px]">Map View</span>
            </button>
          </div>

          {/* Auto-Play Toggle */}
          {viewMode === 'showcase' && (
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isPlaying 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isPlaying ? "Pause Auto Stream" : "Resume Auto Stream"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-300" />}
            </button>
          )}
        </div>
      </div>

      {/* MAP VIEW FALLBACK MODE */}
      {viewMode === 'map' ? (
        <div className="flex-1 w-full h-full relative">
          <PropertyMap
            listings={listings}
            selectedListing={selectedListing}
            onSelectListing={onSelectListing}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>
      ) : (
        /* SHOWCASE REEL MODE */
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          
          {/* CATEGORY FILTER TABS */}
          <div className="bg-slate-900/60 px-3 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 z-10">
            <button
              type="button"
              onClick={() => handleTabChange('hot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'hot'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>🔥 Trending Hot</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('new')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Newest Additions</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('luxury')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'luxury'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-sm font-extrabold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>💎 Verified Luxury</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('instant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'instant'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Instant Tour</span>
            </button>
          </div>

          {/* AUTO-PLAY PROGRESS COUNTDOWN BAR */}
          {isPlaying && (
            <div className="w-full bg-slate-900 h-1 relative overflow-hidden shrink-0">
              <div 
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 h-full transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* HERO ACTIVE PROPERTY SPOTLIGHT CARD */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden relative min-h-0 p-3 gap-2.5">
            
            {/* 1. UNOBSTRUCTED HIGH-RES PHOTO VIEWPORT */}
            <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl group min-h-0">
              
              {/* DYNAMIC IMAGE DISPLAY WITH ANIMATED ENTRANCE */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentListing.id}-${activeImageIndex}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full h-full relative"
                >
                  <img
                    src={images[activeImageIndex] || images[0]}
                    alt={currentListing.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle Gradient Overlays at edges only */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />
                </motion.div>
              </AnimatePresence>

              {/* FLOATING TOP BADGES (MINIMAL PILLS) */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                
                {/* Location & Type Pill */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <span className="bg-slate-900/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg max-w-[200px] sm:max-w-none truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{currentListing.location}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-200 capitalize shrink-0">{currentListing.type}</span>
                  </span>
                </div>

                {/* Price Pill & Favorite Action */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="bg-emerald-600/95 backdrop-blur-md text-white border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-black tracking-tight shadow-lg">
                    {primaryFormatted} <span className="text-[10px] font-normal text-emerald-100">{periodLabel}</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => onToggleFavorite && onToggleFavorite(e, currentListing.id)}
                    className={`p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                      isFavorited
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg scale-105'
                        : 'bg-slate-900/70 border-white/20 text-white hover:bg-slate-900 hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* MANUAL PREV / NEXT NAVIGATION CONTROLS */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 shadow-lg opacity-70 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                title="Previous Property"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 shadow-lg opacity-70 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                title="Next Property"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* BOTTOM OF IMAGE: PHOTO DOTS PAGINATION */}
              {images.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-md">
                  {images.map((_, imgIdx) => (
                    <button
                      key={imgIdx}
                      type="button"
                      onClick={() => setActiveImageIndex(imgIdx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeImageIndex === imgIdx
                          ? 'w-4 bg-emerald-400'
                          : 'w-1.5 bg-white/40 hover:bg-white/80'
                      }`}
                      title={`Photo ${imgIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2. DEDICATED STREAMLINED METADATA DOCK (OUTSIDE IMAGE FRAME) */}
            <div className="bg-slate-900/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              
              {/* Title & Key Specs */}
              <div className="min-w-0 flex-1 space-y-1">
                <h2 
                  onClick={() => onSelectListing(currentListing)}
                  className="text-sm sm:text-base font-display font-black text-white hover:text-emerald-300 transition-colors cursor-pointer line-clamp-1 tracking-tight"
                >
                  {currentListing.title}
                </h2>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{currentListing.bedrooms} Bed</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{currentListing.bathrooms} Bath</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{currentListing.size} m²</span>
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => onSelectListing(currentListing)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
              >
                <span>View Details & Tour</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

          {/* INCOMING QUEUE STRIP AT BOTTOM */}
          <div className="bg-slate-900/90 border-t border-slate-800 p-2 shrink-0">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-400 px-2 mb-1.5 flex items-center justify-between">
              <span>Up Next in Reel ({showcaseListings.length} Properties)</span>
              <span className="text-emerald-400 font-sans">Click any card to spotlight</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {showcaseListings.map((item, idx) => {
                const isActive = idx === activeIndex;
                const thumbImg = item.images && item.images.length > 0 ? item.images[0] : '';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      setActiveImageIndex(0);
                      setProgress(0);
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer min-w-[160px] max-w-[200px] ${
                      isActive
                        ? 'bg-slate-800 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-md scale-102'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <img 
                      src={thumbImg} 
                      alt={item.title} 
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-extrabold truncate">
                        ${item.price} <span className="text-slate-400 font-normal">/mo</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
