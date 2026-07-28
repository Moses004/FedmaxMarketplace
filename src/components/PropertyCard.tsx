import React from 'react';
import { Listing } from '../types';
import { Bed, Bath, Maximize, MapPin, Calendar, Heart, Sparkles } from 'lucide-react';
import PropertyStatusBadge from './PropertyStatusBadge';

interface PropertyCardProps {
  key?: string;
  listing: Listing;
  isSelected: boolean;
  onClick: () => void;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  distanceKm?: number | null;
}

export default function PropertyCard({ listing, isSelected, onClick, isFavorited, onToggleFavorite, distanceKm }: PropertyCardProps) {
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

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-slate-600 hover:text-rose-500 hover:bg-white transition-all z-10 border border-slate-100 group/fav"
          title={isFavorited ? "Remove from Saved" : "Save Property"}
        >
          <Heart className={`w-3.5 h-3.5 transition-transform group-hover/fav:scale-110 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
        </button>

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

        {/* Floating Price */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-bold text-base shadow-lg flex items-baseline gap-0.5 z-10 border border-white/10">
          <span className="text-xs font-semibold text-emerald-400">€</span>
          <span className="text-lg tracking-tight">{listing.price}</span>
          <span className="text-[10px] text-slate-300 font-normal">/month</span>
        </div>
      </div>

      {/* Property Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="line-clamp-1">{listing.location}</span>
            </div>
            {distanceKm !== undefined && distanceKm !== null && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm} km`}
              </span>
            )}
          </div>
        </div>

        {/* Features / Icons Row */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-50/80 pt-3.5 mt-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 justify-center bg-slate-50 py-1.5 rounded-lg border border-slate-100/50">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{listing.bedrooms} Bed</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center bg-slate-50 py-1.5 rounded-lg border border-slate-100/50">
            <Bath className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{listing.bathrooms} Bath</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center bg-slate-50 py-1.5 rounded-lg border border-slate-100/50">
            <Maximize className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{listing.size} m²</span>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-3 pt-2 border-t border-dashed border-slate-100">
          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Available from: <strong>{new Date(listing.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
        </div>
      </div>
    </div>
  );
}
