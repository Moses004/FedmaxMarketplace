import React from 'react';
import { Listing } from '../types';
import { ArrowLeftRight, X, Trash2, Layers } from 'lucide-react';

interface CompareBarProps {
  comparedListings: Listing[];
  onOpenModal: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CompareBar({
  comparedListings,
  onOpenModal,
  onRemove,
  onClear,
}: CompareBarProps) {
  if (comparedListings.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] md:bottom-5 left-1/2 -translate-x-1/2 z-[80] w-[92%] max-w-2xl bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3 px-4 flex items-center justify-between gap-3 text-white animate-slide-up">
      
      {/* Thumbnails & Count */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-xs block leading-tight text-white">
              Compare Homes
            </span>
            <span className="text-[10px] text-emerald-400 font-bold block">
              {comparedListings.length} of 4 selected
            </span>
          </div>
        </div>

        {/* Selected Image Thumbnails */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar pl-2 border-l border-slate-700/80">
          {comparedListings.map((listing) => (
            <div
              key={listing.id}
              className="relative group shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-slate-600 bg-slate-800"
            >
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(listing.id)}
                className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title={`Remove ${listing.title}`}
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Clear selected properties"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
          <span>Compare ({comparedListings.length})</span>
        </button>
      </div>

    </div>
  );
}
