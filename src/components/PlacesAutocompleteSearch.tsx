import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Building, Globe, X, Compass, Check } from 'lucide-react';
import { Listing } from '../types';

export interface LocationSuggestion {
  id: string;
  primaryText: string;
  secondaryText: string;
  category: 'city' | 'neighborhood' | 'property' | 'google_place';
  lat?: number;
  lng?: number;
  zoom?: number;
  placeId?: string;
}

interface PlacesAutocompleteSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSelectLocation?: (location: { name: string; lat?: number; lng?: number; zoom?: number }) => void;
  placeholder?: string;
  className?: string;
  listings?: Listing[];
}

// Preset Major Launch Cities & Neighborhoods for quick autocomplete & offline fallback
const CURATED_PLACES: Omit<LocationSuggestion, 'id'>[] = [
  { primaryText: 'Madrid', secondaryText: 'Community of Madrid, Spain', category: 'city', lat: 40.4167, lng: -3.7037, zoom: 13 },
  { primaryText: 'Barcelona', secondaryText: 'Catalonia, Spain', category: 'city', lat: 41.3851, lng: 2.1734, zoom: 13 },
  { primaryText: 'Salamanca', secondaryText: 'Madrid, Spain', category: 'neighborhood', lat: 40.4285, lng: -3.6825, zoom: 14 },
  { primaryText: 'Malasaña', secondaryText: 'Madrid, Spain', category: 'neighborhood', lat: 40.4230, lng: -3.7042, zoom: 15 },
  { primaryText: 'Retiro', secondaryText: 'Madrid, Spain', category: 'neighborhood', lat: 40.4150, lng: -3.6830, zoom: 14 },
  { primaryText: 'Chamberí', secondaryText: 'Madrid, Spain', category: 'neighborhood', lat: 40.4340, lng: -3.7030, zoom: 15 },
  { primaryText: 'Sol & Plaza Mayor', secondaryText: 'Centro, Madrid, Spain', category: 'neighborhood', lat: 40.4165, lng: -3.7056, zoom: 16 },
  { primaryText: 'Eixample', secondaryText: 'Barcelona, Spain', category: 'neighborhood', lat: 41.3895, lng: 2.1558, zoom: 14 },
  { primaryText: 'Barceloneta', secondaryText: 'Barcelona, Spain', category: 'neighborhood', lat: 41.3789, lng: 2.1895, zoom: 15 },
  { primaryText: 'Gràcia', secondaryText: 'Barcelona, Spain', category: 'neighborhood', lat: 41.4025, lng: 2.1560, zoom: 15 },
  { primaryText: 'Valencia', secondaryText: 'Valencian Community, Spain', category: 'city', lat: 39.4699, lng: -0.3763, zoom: 13 },
  { primaryText: 'Seville', secondaryText: 'Andalusia, Spain', category: 'city', lat: 37.3891, lng: -5.9845, zoom: 13 },
  { primaryText: 'Lisbon', secondaryText: 'Portugal', category: 'city', lat: 38.7223, lng: -9.1393, zoom: 13 },
  { primaryText: 'Porto', secondaryText: 'Portugal', category: 'city', lat: 41.1579, lng: -8.6291, zoom: 13 }
];

export default function PlacesAutocompleteSearch({
  value,
  onChange,
  onSelectLocation,
  placeholder = "Search by city, neighborhood, street, metro, or home title...",
  className = "",
  listings = [],
}: PlacesAutocompleteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isGooglePlacesLoading, setIsGooglePlacesLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Google Places Autocomplete Service when Google Maps JS API is ready
  useEffect(() => {
    const initPlaces = () => {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
        if (!autocompleteServiceRef.current) {
          try {
            autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
          } catch (err) {
            console.info('[PlacesAutocomplete] Google Places Service init exception:', err);
          }
        }
      }
    };

    initPlaces();
    const timer = setInterval(initPlaces, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate suggestions based on user input
  const fetchSuggestions = useCallback((query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const results: LocationSuggestion[] = [];

    // 1. Filter curated places (Cities & Neighborhoods)
    CURATED_PLACES.forEach((place, idx) => {
      if (
        place.primaryText.toLowerCase().includes(trimmed) ||
        place.secondaryText.toLowerCase().includes(trimmed)
      ) {
        results.push({
          id: `curated-${idx}-${place.primaryText}`,
          ...place,
        });
      }
    });

    // 2. Filter available active property listings
    listings.forEach((listing) => {
      if (
        listing.title.toLowerCase().includes(trimmed) ||
        listing.location.toLowerCase().includes(trimmed)
      ) {
        const parts = listing.location.split(',');
        const primary = parts[0] || listing.title;
        const secondary = parts.slice(1).join(',').trim() || 'Madrid, Spain';

        results.push({
          id: `listing-${listing.id}`,
          primaryText: listing.title,
          secondaryText: `${primary} • €${listing.price}/mo`,
          category: 'property',
          lat: listing.lat,
          lng: listing.lng,
          zoom: 15,
        });
      }
    });

    // 3. Google Places API Live Autocomplete (if available)
    if (autocompleteServiceRef.current && trimmed.length >= 2) {
      setIsGooglePlacesLoading(true);
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            types: ['geocode', 'establishment'],
          },
          (predictions: any[], status: any) => {
            setIsGooglePlacesLoading(false);
            if (status === (window as any).google?.maps?.places?.PlacesServiceStatus?.OK && predictions) {
              const googleResults: LocationSuggestion[] = predictions.slice(0, 4).map((p) => ({
                id: `gplace-${p.place_id}`,
                primaryText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || 'Google Places Location',
                category: 'google_place',
                placeId: p.place_id,
              }));

              // Merge and deduplicate by primaryText
              setSuggestions((prev) => {
                const combined = [...prev, ...googleResults];
                const seen = new Set<string>();
                return combined.filter((item) => {
                  const key = item.primaryText.toLowerCase();
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                }).slice(0, 8);
              });
            }
          }
        );
      } catch (err) {
        setIsGooglePlacesLoading(false);
      }
    }

    // Deduplicate and limit to top 8 items
    const uniqueMap = new Map<string, LocationSuggestion>();
    results.forEach((item) => {
      const key = `${item.primaryText}-${item.secondaryText}`.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const finalSuggestions = Array.from(uniqueMap.values()).slice(0, 8);
    setSuggestions(finalSuggestions);
    setIsOpen(finalSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [listings]);

  // Trigger suggestions on value change
  useEffect(() => {
    if (value) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, fetchSuggestions]);

  // Handle suggestion selection
  const handleSelect = (item: LocationSuggestion) => {
    onChange(item.primaryText);
    setIsOpen(false);

    // Geocode or pan map if coordinates available
    if (item.lat && item.lng) {
      onSelectLocation?.({
        name: item.primaryText,
        lat: item.lat,
        lng: item.lng,
        zoom: item.zoom || 14,
      });
    } else if (item.placeId && typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      // Use Geocoder to resolve lat/lng from placeId
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ placeId: item.placeId }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            onSelectLocation?.({
              name: item.primaryText,
              lat: loc.lat(),
              lng: loc.lng(),
              zoom: 14,
            });
          }
        });
      } catch (e) {
        console.info('[PlacesAutocomplete] Geocoder failed:', e);
      }
    } else {
      onSelectLocation?.({ name: item.primaryText });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryBadge = (category: LocationSuggestion['category']) => {
    switch (category) {
      case 'city':
        return <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><Globe className="w-2.5 h-2.5" /> City</span>;
      case 'neighborhood':
        return <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><Compass className="w-2.5 h-2.5" /> District</span>;
      case 'property':
        return <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><Building className="w-2.5 h-2.5" /> Listing</span>;
      case 'google_place':
      default:
        return <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><MapPin className="w-2.5 h-2.5 text-sky-600" /> Place</span>;
    }
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim()) fetchSuggestions(value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-2xs"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Panel */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 bg-slate-50/80 flex items-center justify-between text-[11px] font-bold text-slate-500 px-3">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Compass className="w-3.5 h-3.5" />
              <span>Location &amp; Places Autocomplete</span>
            </span>
            {isGooglePlacesLoading && (
              <span className="text-[10px] text-sky-600 animate-pulse font-medium">Querying Google Places...</span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {item.primaryText}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-normal">
                        {item.secondaryText}
                      </div>
                    </div>
                  </div>
                  {getCategoryBadge(item.category)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
