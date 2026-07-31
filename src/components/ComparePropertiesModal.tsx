import React, { useState, useMemo } from 'react';
import { Listing } from '../types';
import { 
  X, Check, ArrowLeftRight, Sparkles, Building, MapPin, 
  Bed, Bath, Maximize, Calendar, Plus, Trash2, Eye, ShieldCheck,
  Zap, Info, CheckCircle2, DollarSign
} from 'lucide-react';
import PropertyStatusBadge from './PropertyStatusBadge';
import { getListingPrices } from '../utils/currency';

interface ComparePropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[]; // All available listings to allow adding more
  comparedListings: Listing[];
  onRemoveCompare: (id: string) => void;
  onAddCompare: (listing: Listing) => void;
  onClearCompare: () => void;
  onSelectListingDetails: (listing: Listing) => void;
  displayCurrency?: string;
}

// Master list of known amenities to check against each property
const ALL_COMMON_AMENITIES = [
  'WiFi / High-Speed Internet',
  'Air Conditioning',
  'Heating',
  'Balcony / Terrace',
  'Swimming Pool',
  'Gym / Fitness Room',
  'Parking / Garage',
  'Furnished',
  'Pets Allowed',
  'Washing Machine',
  'Dishwasher',
  'Elevator / Lift',
  'Solar Power',
  'Security System / Gated',
  'Garden / Outdoor Lawn',
];

export default function ComparePropertiesModal({
  isOpen,
  onClose,
  listings,
  comparedListings,
  onRemoveCompare,
  onAddCompare,
  onClearCompare,
  onSelectListingDetails,
  displayCurrency = 'USD',
}: ComparePropertiesModalProps) {
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [showAddSelector, setShowAddSelector] = useState(false);

  if (!isOpen) return null;

  // Unselected listings for quick addition
  const availableToAdd = listings.filter(
    (l) => !comparedListings.some((c) => c.id === l.id)
  );

  // Extract all unique amenities present in any of the compared listings + standard list
  const combinedAmenitiesList = useMemo(() => {
    const set = new Set<string>(ALL_COMMON_AMENITIES);
    comparedListings.forEach((l) => {
      l.amenities?.forEach((am) => set.add(am));
    });
    return Array.from(set);
  }, [comparedListings]);

  // Compute best value metrics (e.g. lowest price, largest size, lowest price/sqm)
  const bestMetrics = useMemo(() => {
    if (comparedListings.length === 0) return {};

    const minPrice = Math.min(...comparedListings.map((l) => l.price));
    const maxSize = Math.max(...comparedListings.map((l) => l.size || 0));
    const maxBeds = Math.max(...comparedListings.map((l) => l.bedrooms || 0));

    const pricePerSqmMap = comparedListings.map((l) =>
      l.size > 0 ? l.price / l.size : Infinity
    );
    const minPricePerSqm = Math.min(...pricePerSqmMap);

    return {
      minPrice,
      maxSize,
      maxBeds,
      minPricePerSqm,
    };
  }, [comparedListings]);

  // Helper function to determine if a specific row has differences across compared listings
  const hasDifference = (getValue: (l: Listing) => any) => {
    if (comparedListings.length <= 1) return false;
    const firstVal = JSON.stringify(getValue(comparedListings[0]));
    return comparedListings.some((l) => JSON.stringify(getValue(l)) !== firstVal);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-slate-900 dark:text-slate-100 text-lg sm:text-xl">
                  Compare Properties
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {comparedListings.length} / 4 Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Side-by-side analysis of pricing, amenities, specifications &amp; location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Highlight Differences Toggle */}
            {comparedListings.length > 1 && (
              <button
                type="button"
                onClick={() => setHighlightDiff(!highlightDiff)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  highlightDiff
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
                title="Visually highlight rows with differing values"
              >
                <Zap className={`w-3.5 h-3.5 ${highlightDiff ? 'text-white' : 'text-amber-500'}`} />
                <span>{highlightDiff ? 'Differences Highlighted' : 'Highlight Differences'}</span>
              </button>
            )}

            {/* Clear All */}
            {comparedListings.length > 0 && (
              <button
                type="button"
                onClick={onClearCompare}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* EMPTY OR SINGLE SELECTION STATE */}
          {comparedListings.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ArrowLeftRight className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  No Properties Selected for Comparison
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click the Compare button on any property card to select up to 4 homes and view them side-by-side.
                </p>
              </div>

              {/* Quick Pick Recommendations */}
              {listings.length > 0 && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                    Quick Add to Compare
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {listings.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onAddCompare(item)}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-2.5 hover:border-emerald-500 transition-all cursor-pointer text-left group"
                      >
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600">
                            {item.title}
                          </h5>
                          <span className="text-[11px] font-extrabold text-emerald-600">
                            €{item.price}/mo
                          </span>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Notice when only 1 item selected */}
              {comparedListings.length === 1 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Select at least 1 more property card to compare features side-by-side.</span>
                  </div>
                  {availableToAdd.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddSelector(true)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shrink-0 cursor-pointer"
                    >
                      + Add 2nd Property
                    </button>
                  )}
                </div>
              )}

              {/* COMPARISON TABLE / COLUMN GRID */}
              <div className="overflow-x-auto pb-2 no-scrollbar">
                <div
                  className="grid gap-4 min-w-[700px]"
                  style={{
                    gridTemplateColumns: `200px repeat(${comparedListings.length + (comparedListings.length < 4 ? 1 : 0)}, minmax(220px, 1fr))`,
                  }}
                >
                  
                  {/* HEADER ROW - PROPERTIES PREVIEW & ACTIONS */}
                  <div className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex flex-col justify-end pb-3 border-b border-slate-200 dark:border-slate-800">
                    Property Specs
                  </div>

                  {comparedListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 relative group"
                    >
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveCompare(listing.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all z-10 cursor-pointer"
                        title="Remove from comparison"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-2">
                        {/* Thumbnail */}
                        <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-200 relative">
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <PropertyStatusBadge status={listing.status} size="sm" />
                          </div>
                        </div>

                        {/* Title & Location */}
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                            {listing.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{listing.location}</span>
                          </span>
                        </div>
                      </div>

                      {/* Main Price & View Details CTA */}
                      {(() => {
                        const { primaryFormatted, secondaryFormatted } = getListingPrices(listing, displayCurrency);
                        return (
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-1">
                                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                                  {primaryFormatted}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">/mo</span>
                                {listing.price === bestMetrics.minPrice && comparedListings.length > 1 && (
                                  <span className="ml-auto text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    Cheapest
                                  </span>
                                )}
                              </div>
                              {secondaryFormatted && (
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {secondaryFormatted}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectListingDetails(listing);
                                onClose();
                              }}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View Details</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ))}

                  {/* Add Slot Column (if < 4 properties compared) */}
                  {comparedListings.length < 4 && (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/20 min-h-[220px]">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                        Add Another Property
                      </span>
                      <p className="text-[10.5px] text-slate-400 max-w-[140px]">
                        Compare up to 4 listings at once
                      </p>
                      {availableToAdd.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddSelector(!showAddSelector)}
                          className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                        >
                          {showAddSelector ? 'Hide Selector' : '+ Select Property'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ---------------- SECTION 1: PRICE & FINANCIALS ---------------- */}
                  <div className="col-span-full pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h5 className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Pricing &amp; Cost Breakdown</span>
                    </h5>
                  </div>

                  {/* Row: Monthly Rent */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                    Monthly Rent
                  </div>
                  {comparedListings.map((l) => {
                    const diff = highlightDiff && hasDifference((x) => x.price);
                    const isMin = l.price === bestMetrics.minPrice && comparedListings.length > 1;
                    const { primaryFormatted, secondaryFormatted } = getListingPrices(l, displayCurrency);
                    return (
                      <div
                        key={`price-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{primaryFormatted} / mo</span>
                          {secondaryFormatted && (
                            <span className="text-[10px] text-slate-400 font-semibold">{secondaryFormatted}</span>
                          )}
                        </div>
                        {isMin && (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Cheapest
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}

                  {/* Row: Yearly Discount */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                    Annual Payment Discount
                  </div>
                  {comparedListings.map((l) => {
                    const discount = l.annualDiscountPercentage || 0;
                    const diff = highlightDiff && hasDifference((x) => x.annualDiscountPercentage || 0);
                    return (
                      <div
                        key={`discount-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-semibold ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        {discount > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Save {discount}% / year</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Standard rate</span>
                        )}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}

                  {/* Row: Price per m² */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                    Price per m²
                  </div>
                  {comparedListings.map((l) => {
                    const pricePerSqm = l.size > 0 ? Math.round((l.price / l.size) * 10) / 10 : null;
                    const isBestSqm = pricePerSqm && pricePerSqm === bestMetrics.minPricePerSqm && comparedListings.length > 1;
                    const diff = highlightDiff && hasDifference((x) => (x.size > 0 ? Math.round(x.price / x.size) : 0));

                    return (
                      <div
                        key={`sqm-price-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          {pricePerSqm ? `€${pricePerSqm} / m²` : 'N/A'}
                        </span>
                        {isBestSqm && (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Best Value
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}


                  {/* ---------------- SECTION 2: SPECIFICATIONS & SIZE ---------------- */}
                  <div className="col-span-full pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h5 className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Maximize className="w-3.5 h-3.5" />
                      <span>Space &amp; Specifications</span>
                    </h5>
                  </div>

                  {/* Bedrooms */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bedrooms</span>
                  </div>
                  {comparedListings.map((l) => {
                    const diff = highlightDiff && hasDifference((x) => x.bedrooms);
                    return (
                      <div
                        key={`beds-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-bold text-slate-800 dark:text-slate-200 ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        {l.bedrooms} {l.bedrooms === 1 ? 'Bed' : 'Beds'}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}

                  {/* Bathrooms */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bathrooms</span>
                  </div>
                  {comparedListings.map((l) => {
                    const diff = highlightDiff && hasDifference((x) => x.bathrooms);
                    return (
                      <div
                        key={`baths-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-bold text-slate-800 dark:text-slate-200 ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        {l.bathrooms} {l.bathrooms === 1 ? 'Bath' : 'Baths'}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}

                  {/* Total Size */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-slate-400" />
                    <span>Total Area (m²)</span>
                  </div>
                  {comparedListings.map((l) => {
                    const isMax = l.size === bestMetrics.maxSize && comparedListings.length > 1;
                    const diff = highlightDiff && hasDifference((x) => x.size);
                    return (
                      <div
                        key={`size-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <span className="text-slate-900 dark:text-slate-100">{l.size} m²</span>
                        {isMax && (
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Largest
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}

                  {/* Move-in Availability */}
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Available Date</span>
                  </div>
                  {comparedListings.map((l) => {
                    const dateStr = new Date(l.availableFrom).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const diff = highlightDiff && hasDifference((x) => x.availableFrom);
                    return (
                      <div
                        key={`date-${l.id}`}
                        className={`p-3 rounded-xl border text-xs font-medium text-slate-800 dark:text-slate-200 ${
                          diff
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        {dateStr}
                      </div>
                    );
                  })}
                  {comparedListings.length < 4 && <div className="bg-transparent" />}


                  {/* ---------------- SECTION 3: AMENITIES MATRIX ---------------- */}
                  <div className="col-span-full pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h5 className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Amenities &amp; Features Checklist</span>
                    </h5>
                  </div>

                  {combinedAmenitiesList.map((amenity) => {
                    const diff =
                      highlightDiff &&
                      hasDifference((x) =>
                        Boolean(x.amenities?.some((a) => a.toLowerCase().includes(amenity.toLowerCase())))
                      );

                    return (
                      <React.Fragment key={`row-amenity-${amenity}`}>
                        <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center pr-2 py-1">
                          {amenity}
                        </div>

                        {comparedListings.map((l) => {
                          const hasIt = Boolean(
                            l.amenities?.some((a) =>
                              a.toLowerCase().includes(amenity.toLowerCase()) ||
                              amenity.toLowerCase().includes(a.toLowerCase())
                            )
                          );

                          return (
                            <div
                              key={`am-${amenity}-${l.id}`}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                                diff
                                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                                  : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                              }`}
                            >
                              {hasIt ? (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[11px] font-bold hidden sm:inline">Included</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600">
                                  <X className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                  <span className="text-[11px] font-normal hidden sm:inline">—</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {comparedListings.length < 4 && <div className="bg-transparent" />}
                      </React.Fragment>
                    );
                  })}

                </div>
              </div>

              {/* Quick Add Dropdown Selector Modal Inline */}
              {showAddSelector && availableToAdd.length > 0 && (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Select a listing to add to comparison:
                    </h5>
                    <button
                      onClick={() => setShowAddSelector(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {availableToAdd.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onAddCompare(item);
                          if (comparedListings.length >= 3) {
                            setShowAddSelector(false);
                          }
                        }}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 hover:border-emerald-500 transition-all cursor-pointer text-left"
                      >
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h6 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {item.title}
                          </h6>
                          <span className="text-[11px] font-extrabold text-emerald-600">
                            €{item.price}/mo
                          </span>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Comparing verified real estate metrics across launch markets</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
}
