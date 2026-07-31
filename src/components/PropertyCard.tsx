import React from 'react';
import { Listing } from '../types';
import { Bed, Bath, Maximize, MapPin, Calendar, Heart, Sparkles, ArrowLeftRight, Check, Play } from 'lucide-react';
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
  const { primaryFormatted, secondaryFormatted } = getListingPrices(listing, displayCurrency);
  // Dynamic colors for different housing types
  const typeColors: Record<string, string> = {
    'single-room': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'self-contained': 'bg-purple-50 text-purple-700 border-purple-200',
    '1-bedroom-flat': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '2-bedroom-flat': 'bg-sky-50 text-sky-700 border-sky-200',
    '3plus-bedroom-flat': 'bg-blue-50 text-blue-700 border-blue-200',
    'duplex': 'bg-violet-50 text-violet-700 border-violet-200',
    'penthouse': 'bg-amber-50 text-amber-800 border-amber-200',
    'bungalow': 'bg-orange-50 text-orange-700 border-orange-200',
    'townhouse': 'bg-teal-50 text-teal-700 border-teal-200',
    'villa': 'bg-rose-50 text-rose-700 border-rose-200',
    'shared-apartment': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'office-commercial': 'bg-slate-100 text-slate-800 border-slate-300',
    'room': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'studio': 'bg-purple-50 text-purple-700 border-purple-200',
    'apartment': 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    <div
      id={`property-card-${listing.id}`}
      onClick={onClick}
      className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col h-full ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xl'
          : 'border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Property Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={listing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

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
                  : 'bg-white/90 text-slate-700 hover:bg-white hover:text-emerald-600 border-slate-100'
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
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
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
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-slate-600 hover:text-rose-500 hover:bg-white transition-all border border-slate-100 group/fav"
            title={isFavorited ? "Remove from Saved" : "Save Property"}
          >
            <Heart className={`w-3.5 h-3.5 transition-transform group-hover/fav:scale-110 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
          </button>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${typeColors[listing.type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {typeLabels[listing.type] || listing.type}
            </span>
            <PropertyStatusBadge status={listing.status} size="sm" />
          </div>
          {listing.annualDiscountPercentage && listing.annualDiscountPercentage > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs bg-emerald-600 text-white border-emerald-500 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300 shrink-0" />
              <span>Save {listing.annualDiscountPercentage}% Yearly</span>
            </span>
          )}
        </div>

        {/* Video Walkthrough Badge Indicator */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-white/10 shadow-sm">
          <Play className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
          <span>HD Video Tour</span>
        </div>

        {/* Floating Price */}
        <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl font-bold shadow-lg flex flex-col items-end justify-center z-10 border border-white/10">
          <div className="flex items-baseline gap-1">
            <span className="text-lg tracking-tight font-black text-white">{primaryFormatted}</span>
            <span className="text-xs text-emerald-300 font-extrabold">/mo</span>
          </div>
          {secondaryFormatted && (
            <span className="text-[10px] font-bold text-emerald-400 -mt-0.5 tracking-tight">
              {secondaryFormatted}
            </span>
          )}
        </div>
      </div>

      {/* Property Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-slate-900 text-base sm:text-[17px] leading-snug tracking-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-center justify-between gap-1 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span className="line-clamp-1">{listing.location}</span>
            </div>
            {distanceKm !== undefined && distanceKm !== null && (
              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm} km`}
              </span>
            )}
          </div>
        </div>

        {/* Features / Icons Row */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-3.5 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 justify-center bg-slate-50/90 py-2 rounded-xl border border-slate-200/60 whitespace-nowrap">
            <Bed className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-bold">{listing.bedrooms} Bed</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center bg-slate-50/90 py-2 rounded-xl border border-slate-200/60 whitespace-nowrap">
            <Bath className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-bold">{listing.bathrooms} Bath</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center bg-slate-50/90 py-2 rounded-xl border border-slate-200/60 whitespace-nowrap">
            <Maximize className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-bold">{listing.size} m²</span>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3 pt-2.5 border-t border-dashed border-slate-100">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Available from: <strong className="font-extrabold text-slate-900">{new Date(listing.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs flex flex-col h-full animate-fade-in">
      {/* Property Image Skeleton */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <div className="w-full h-full animate-shimmer" />
        
        {/* Floating Top Badge Skeleton */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div className="w-20 h-6 rounded-full bg-slate-200/90 animate-shimmer" />
          <div className="w-16 h-6 rounded-full bg-slate-200/90 animate-shimmer" />
        </div>

        {/* Favorite Button Skeleton */}
        <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-200/90 animate-shimmer" />

        {/* Floating Price Skeleton */}
        <div className="absolute bottom-3 right-3 w-24 h-7 rounded-xl bg-slate-200/90 animate-shimmer" />
      </div>

      {/* Property Information Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title line */}
          <div className="h-5 w-3/4 rounded-lg bg-slate-200 animate-shimmer" />
          {/* Location line */}
          <div className="h-3.5 w-1/2 rounded-md bg-slate-200 animate-shimmer" />
        </div>

        {/* Features / Icons Grid Skeleton */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5">
          <div className="h-7 rounded-lg bg-slate-100 animate-shimmer" />
          <div className="h-7 rounded-lg bg-slate-100 animate-shimmer" />
          <div className="h-7 rounded-lg bg-slate-100 animate-shimmer" />
        </div>

        {/* Availability Line Skeleton */}
        <div className="h-4 w-2/3 rounded-md bg-slate-100 animate-shimmer pt-2" />
      </div>
    </div>
  );
}

