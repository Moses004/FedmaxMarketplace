import React from 'react';
import { Listing } from '../types';
import { Bed, Bath, Maximize, MapPin, Calendar, Heart } from 'lucide-react';

interface PropertyCardProps {
  key?: string;
  listing: Listing;
  isSelected: boolean;
  onClick: () => void;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export default function PropertyCard({ listing, isSelected, onClick, isFavorited, onToggleFavorite }: PropertyCardProps) {
  // Dynamic colors for different housing types
  const typeColors = {
    room: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    studio: 'bg-purple-50 text-purple-700 border-purple-100',
    apartment: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const typeLabels = {
    room: 'Shared Room',
    studio: 'Private Studio',
    apartment: 'Entire Apartment',
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
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${typeColors[listing.type]}`}>
            {typeLabels[listing.type]}
          </span>
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
          
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="line-clamp-1">{listing.location}</span>
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
