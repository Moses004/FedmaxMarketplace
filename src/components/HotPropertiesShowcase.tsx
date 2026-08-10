import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';
import { 
  Flame, Sparkles, ShieldCheck, Zap, Play, Pause, ChevronLeft, ChevronRight, 
  MapPin, Bed, Bath, Maximize, Eye, Calendar, Heart, ArrowRight, Video, 
  Share2, Compass, Layers, CheckCircle2, TrendingUp, Clock, Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PropertyStatusBadge from './PropertyStatusBadge';
import { getListingPrices } from '../utils/currency';
import PropertyMap from './PropertyMap';
import FullScreenImageGallery from './FullScreenImageGallery';

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
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>('cover');
  const [showFullScreenGallery, setShowFullScreenGallery] = useState<boolean>(false);

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

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
      <div className="bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        
        {/* Left Title & Live Pulse Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-md">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <h3 className="font-display font-black text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Hot & New Properties Reel</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded-md hidden xs:inline-block">
                LIVE STREAM
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 hidden sm:block">Dynamic spotlight of available verified residences</p>
          </div>
        </div>

        {/* Center / Right Mode Switcher (Showcase Reel vs Map View) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'showcase'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-[11px]">Reel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-[11px]">Map</span>
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
              {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-300" />}
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
          <div className="flex-1 flex flex-col overflow-hidden relative min-h-0 p-2 sm:p-3">
            
            {/* 1. UNOBSTRUCTED FULL-BLEED HIGH-RES PHOTO VIEWPORT */}
            <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group min-h-0 flex flex-col justify-between">
              
              {/* DYNAMIC IMAGE DISPLAY WITH ANIMATED ENTRANCE & DUAL FIT MODES */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentListing.id}-${activeImageIndex}-${imageFitMode}`}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden"
                >
                  {imageFitMode === 'contain' ? (
                    <>
                      {/* Ambient Blurred Backdrop so no empty side bars */}
                      <img
                        src={images[activeImageIndex] || images[0] || FALLBACK_IMAGE}
                        alt=""
                        aria-hidden="true"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                      />
                      {/* Full Uncropped Centered Property Photo */}
                      <img
                        src={images[activeImageIndex] || images[0] || FALLBACK_IMAGE}
                        alt={currentListing.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                      />
                    </>
                  ) : (
                    <img
                      src={images[activeImageIndex] || images[0] || FALLBACK_IMAGE}
                      alt={currentListing.title}
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      className="w-full h-full object-cover object-[center_35%]"
                    />
                  )}
                  {/* Subtle Top & Bottom Vignette Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/90 pointer-events-none z-10" />
                </motion.div>
              </AnimatePresence>

              {/* FLOATING TOP BADGES (MINIMALIST CORNER PILLS) */}
              <div className="relative z-10 p-2 sm:p-3 flex items-center justify-between gap-1.5 pointer-events-none">
                
                {/* Location & Type Pill */}
                <div className="flex items-center gap-1 pointer-events-auto min-w-0">
                  <span className="bg-slate-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-lg truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{currentListing.location}</span>
                    <span className="text-slate-500 shrink-0">•</span>
                    <span className="text-slate-200 capitalize shrink-0 hidden xs:inline">{currentListing.type}</span>
                  </span>
                </div>

                {/* Price Pill, Fit Mode Toggle, Favorite Action & Photo Counter */}
                <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
                  <span className="bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-400/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black tracking-tight shadow-lg whitespace-nowrap">
                    {primaryFormatted} <span className="text-[8.5px] sm:text-[10px] font-normal text-emerald-100">{periodLabel}</span>
                  </span>

                  {/* Full-Screen Touch Gallery Button */}
                  <button
                    type="button"
                    onClick={() => setShowFullScreenGallery(true)}
                    className="bg-emerald-600/90 hover:bg-emerald-600 backdrop-blur-md text-white border border-emerald-400/40 p-1 sm:p-1.5 rounded-full text-xs font-extrabold shadow-lg transition-all cursor-pointer flex items-center gap-1 px-2 sm:px-2.5 hover:scale-105 active:scale-95"
                    title="Open Fullscreen Touch Gallery with Pinch-to-Zoom"
                  >
                    <Maximize className="w-3 h-3 text-white" />
                    <span className="text-[10px] hidden sm:inline">Pinch & Zoom</span>
                  </button>

                  {/* Image Fit Mode Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setImageFitMode(prev => prev === 'cover' ? 'contain' : 'cover')}
                    className="bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/20 hover:border-emerald-400/50 hover:text-emerald-300 p-1 sm:p-1.5 rounded-full text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1 px-2 sm:px-2.5"
                    title={imageFitMode === 'cover' ? "Switch to Uncropped Full Photo Fit" : "Switch to Fill Frame"}
                  >
                    {imageFitMode === 'cover' ? (
                      <>
                        <Maximize2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] hidden sm:inline">Fit Photo</span>
                      </>
                    ) : (
                      <>
                        <Minimize2 className="w-3 h-3 text-sky-400" />
                        <span className="text-[10px] hidden sm:inline">Fill Frame</span>
                      </>
                    )}
                  </button>

                  {images.length > 1 && (
                    <span className="bg-slate-950/80 backdrop-blur-md text-slate-300 border border-white/10 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shadow-md hidden xs:inline-block">
                      {activeImageIndex + 1}/{images.length}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => onToggleFavorite && onToggleFavorite(e, currentListing.id)}
                    className={`p-1 sm:p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                      isFavorited
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg scale-105'
                        : 'bg-slate-950/70 border-white/20 text-white hover:bg-slate-900 hover:text-rose-400'
                    }`}
                    title={isFavorited ? "Remove from Favorites" : "Save to Favorites"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* MANUAL PREV / NEXT NAVIGATION CONTROLS */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 shadow-lg opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                title="Previous Property"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 shadow-lg opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                title="Next Property"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* SLEEK INTEGRATED GLASS METADATA DOCK (FLOATING AT BOTTOM OF IMAGE) */}
              <div className="relative z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent pt-8 pb-3 px-3 sm:px-4 flex flex-col gap-2">
                
                {/* Title & Specs Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 
                      onClick={() => onSelectListing(currentListing)}
                      className="text-sm sm:text-base font-display font-black text-white hover:text-emerald-300 transition-colors cursor-pointer line-clamp-1 tracking-tight drop-shadow-md"
                    >
                      {currentListing.title}
                    </h2>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-200 font-semibold flex-wrap">
                      <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/10">
                        <Bed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{currentListing.bedrooms} Bed</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/10">
                        <Bath className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{currentListing.bathrooms} Bath</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/10">
                        <Maximize className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{currentListing.size} m²</span>
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={() => onSelectListing(currentListing)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-98 self-start sm:self-auto"
                  >
                    <span>View Tour</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Photo Pagination Dots inside bottom dock */}
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {images.map((_, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        onClick={() => setActiveImageIndex(imgIdx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          activeImageIndex === imgIdx
                            ? 'w-5 bg-emerald-400 shadow-xs'
                            : 'w-1.5 bg-white/30 hover:bg-white/70'
                        }`}
                        title={`Photo ${imgIdx + 1}`}
                      />
                    ))}
                  </div>
                )}

              </div>

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
                      src={thumbImg || FALLBACK_IMAGE} 
                      alt={item.title} 
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700 bg-slate-800" 
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

      {/* Full-Screen Touch & Pinch-To-Zoom Gallery Modal */}
      {currentListing && (
        <FullScreenImageGallery
          isOpen={showFullScreenGallery}
          onClose={() => setShowFullScreenGallery(false)}
          images={images}
          initialIndex={activeImageIndex}
          title={currentListing.title}
        />
      )}

    </div>
  );
}
