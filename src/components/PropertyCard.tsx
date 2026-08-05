import React, { useState } from 'react';
import { Listing } from '../types';
import { Bed, Bath, Maximize, MapPin, Calendar, Heart, Sparkles, ArrowLeftRight, Check, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import PropertyStatusBadge from './PropertyStatusBadge';
import { getListingPrices } from '../utils/currency';

interface PropertyCardProps {
  key?: string;
  listing: Listing;
  isSelected: boolean;
  onClick: () => void;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isCompared?: boolean;
  onToggleCompare?: (e: React.MouseEvent) => void;
  distanceKm?: number | null;
  displayCurrency?: string;
}

export default function PropertyCard({ listing, isSelected, onClick, isFavorited, onToggleFavorite, isCompared, onToggleCompare, distanceKm, displayCurrency = 'regional' }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { primaryFormatted, secondaryFormatted, periodLabel, monthlyEquivalentText } = getListingPrices(listing, displayCurrency);
  const images = listing.images && listing.images.length > 0 ? listing.images : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'];
  // Dynamic colors for different housing types
  const typeColors: Record<string, string> = {
    'single-room': 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    'self-contained': 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    '1-bedroom-flat': 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    '2-bedroom-flat': 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    '3plus-bedroom-flat': 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'duplex': 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    'penthouse': 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'bungalow': 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    'townhouse': 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    'villa': 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    'shared-apartment': 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    'office-commercial': 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    'room': 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    'studio': 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'apartment': 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  const typeLabels: Record<string, string> = {
    'single-room': 'Single Room',
    'self-contained': 'Self-Contained',
    '1-bedroom-flat': '1 Bed Flat',
    '2-bedroom-flat': '2 Bed Flat',
    '3plus-bedroom-flat': '3+ Bed Flat',
    'duplex': 'Duplex / Maisonette',
    'penthouse': 'Penthouse',
    'bungalow': 'Bungalow',
    'townhouse': 'Townhouse',
    'villa': 'Luxury Villa',
    'shared-apartment': 'Shared Flat',
    'office-commercial': 'Commercial Office',
    'room': 'Single Room',
    'studio': 'Self-Contained',
    'apartment': 'Apartment',
  };

  return (
    <motion.div
      id={`property-card-${listing.id}`}
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-shadow duration-300 cursor-pointer flex flex-col h-full ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
          : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300/80 dark:hover:border-emerald-700/80 hover:shadow-xl'
      }`}
    >
      {/* Property Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={images[currentImageIndex] || images[0]}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
        />

        {/* Prev / Next Image Navigation Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10 shadow-md cursor-pointer hover:scale-110"
              title="Previous image"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10 shadow-md cursor-pointer hover:scale-110"
              title="Next image"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Page Indicator Dots */}
        {images.length > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-sm">
            {images.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentImageIndex
                    ? 'w-4 bg-emerald-400'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
                title={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Action Buttons Overlay (Favorite & Compare) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(e);
              }}
              className={`flex items-center gap-1 p-1.5 px-2.5 rounded-lg text-xs font-extrabold backdrop-blur-sm shadow-sm transition-all border ${
                isCompared
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-white hover:text-emerald-600 border-slate-100 dark:border-slate-800'
              }`}
              title={isCompared ? "Remove from Compare" : "Compare Property"}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  <span className="text-[11px]">Comparing</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-[11px] hidden group-hover:inline">Compare</span>
                </>
              )}
            </button>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-white transition-all border border-slate-100 dark:border-slate-800 group/fav"
            title={isFavorited ? "Remove from Saved" : "Save Property"}
          >
            <Heart className={`w-3.5 h-3.5 transition-transform group-hover/fav:scale-110 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-slate-400'}`} />
          </button>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start max-w-[55%] sm:max-w-[62%]">
          <div className="flex flex-wrap items-center gap-1.5 max-w-full">
            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm truncate max-w-full ${typeColors[listing.type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {typeLabels[listing.type] || listing.type}
            </span>
            <PropertyStatusBadge status={listing.status} size="sm" />
          </div>
          {listing.annualDiscountPercentage && listing.annualDiscountPercentage > 0 && (
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold border shadow-xs bg-emerald-600 text-white border-emerald-500 flex items-center gap-1 truncate max-w-full">
              <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="truncate">Save {listing.annualDiscountPercentage}% Yearly</span>
            </span>
          )}
        </div>

        {/* Video Walkthrough Badge Indicator */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white px-2 sm:px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-extrabold border border-white/10 shadow-sm">
          <Play className="w-2.5 h-2.5 text-rose-400 fill-rose-400 shrink-0" />
          <span className="truncate">HD Video Tour</span>
        </div>

        {/* Floating Price */}
        <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold shadow-lg flex flex-col items-end justify-center z-10 border border-white/10 max-w-[55%]">
          <div className="flex items-baseline gap-0.5 sm:gap-1 max-w-full truncate">
            <span className="text-base sm:text-lg tracking-tight font-black text-white truncate">{primaryFormatted}</span>
            <span className="text-[10px] sm:text-xs text-emerald-300 font-extrabold shrink-0">{periodLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 -mt-0.5 max-w-full truncate">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 tracking-tight truncate">
              {monthlyEquivalentText}
            </span>
            {secondaryFormatted && (
              <span className="text-[8.5px] font-bold text-emerald-400 tracking-tight truncate hidden sm:inline">
                ({secondaryFormatted})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Property Information */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base md:text-[17px] leading-snug tracking-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-center justify-between gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="line-clamp-1 text-[11px] sm:text-xs">{listing.location}</span>
            </div>
            {distanceKm !== undefined && distanceKm !== null && (
              <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm} km`}
              </span>
            )}
          </div>
        </div>

        {/* Features / Icons Row */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1 sm:gap-1.5 justify-center bg-slate-50/90 dark:bg-slate-800/80 py-1.5 sm:py-2 px-1 rounded-xl border border-slate-200/60 dark:border-slate-700 min-w-0">
            <Bed className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="font-bold text-[10px] sm:text-xs truncate">{listing.bedrooms} Bed</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 justify-center bg-slate-50/90 dark:bg-slate-800/80 py-1.5 sm:py-2 px-1 rounded-xl border border-slate-200/60 dark:border-slate-700 min-w-0">
            <Bath className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="font-bold text-[10px] sm:text-xs truncate">{listing.bathrooms} Bath</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 justify-center bg-slate-50/90 dark:bg-slate-800/80 py-1.5 sm:py-2 px-1 rounded-xl border border-slate-200/60 dark:border-slate-700 min-w-0">
            <Maximize className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="font-bold text-[10px] sm:text-xs truncate">{listing.size} m²</span>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="flex items-center justify-between gap-1 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-2.5 border-t border-dashed border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Available: <strong className="font-extrabold text-slate-900 dark:text-white">{new Date(listing.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong></span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            Verified Lister
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col h-full animate-fade-in">
      {/* Property Image Skeleton */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div className="w-full h-full animate-shimmer" />
        
        {/* Floating Top Badge Skeleton */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div className="w-20 h-6 rounded-full bg-slate-200/90 dark:bg-slate-700/80 animate-shimmer" />
          <div className="w-16 h-6 rounded-full bg-slate-200/90 dark:bg-slate-700/80 animate-shimmer" />
        </div>

        {/* Favorite Button Skeleton */}
        <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-200/90 dark:bg-slate-700/80 animate-shimmer" />

        {/* Floating Price Skeleton */}
        <div className="absolute bottom-3 right-3 w-24 h-7 rounded-xl bg-slate-200/90 dark:bg-slate-700/80 animate-shimmer" />
      </div>

      {/* Property Information Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title line */}
          <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800 animate-shimmer" />
          {/* Location line */}
          <div className="h-3.5 w-1/2 rounded-md bg-slate-200 dark:bg-slate-800 animate-shimmer" />
        </div>

        {/* Features / Icons Grid Skeleton */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3.5">
          <div className="h-7 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          <div className="h-7 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          <div className="h-7 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        </div>

        {/* Availability Line Skeleton */}
        <div className="h-4 w-2/3 rounded-md bg-slate-100 dark:bg-slate-800 animate-shimmer pt-2" />
      </div>
    </div>
  );
}

