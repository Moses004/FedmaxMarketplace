import React from 'react';
import { Compass, Heart, ArrowLeftRight, Calendar, User as UserIcon, Plus, Building } from 'lucide-react';
import { User } from '../types';

interface MobileBottomNavProps {
  currentTab: 'explore' | 'bookings' | 'dashboard' | 'favorites';
  onTabChange: (tab: 'explore' | 'bookings' | 'dashboard' | 'favorites') => void;
  favoritesCount: number;
  comparedCount: number;
  bookingsCount: number;
  onOpenCompare: () => void;
  onOpenProfile: () => void;
  onOpenAddListing?: () => void;
  currentUser: User | null;
}

export default function MobileBottomNav({
  currentTab,
  onTabChange,
  favoritesCount,
  comparedCount,
  bookingsCount,
  onOpenCompare,
  onOpenProfile,
  onOpenAddListing,
  currentUser,
}: MobileBottomNavProps) {
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Explore Tab */}
        <button
          type="button"
          onClick={() => onTabChange('explore')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'explore'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
          }`}
        >
          <div className="relative p-1">
            <Compass className={`w-5 h-5 transition-transform ${currentTab === 'explore' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {currentTab === 'explore' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Explore</span>
        </button>

        {/* Saved Favorites Tab */}
        <button
          type="button"
          onClick={() => onTabChange('favorites')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'favorites'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
          }`}
        >
          <div className="relative p-1">
            <Heart className={`w-5 h-5 transition-transform ${currentTab === 'favorites' ? 'scale-110 fill-emerald-600/20 stroke-[2.5]' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white font-black text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 shadow-xs">
                {favoritesCount}
              </span>
            )}
            {currentTab === 'favorites' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Saved</span>
        </button>

        {/* Landlord Add Listing Action OR Compare */}
        {currentUser?.role === 'landlord' && onOpenAddListing ? (
          <button
            type="button"
            onClick={onOpenAddListing}
            className="flex flex-col items-center justify-center -mt-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 border-4 border-white dark:border-slate-900 flex items-center justify-center transition-transform active:scale-90">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-[9.5px] font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">List</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-all cursor-pointer relative"
          >
            <div className="relative p-1">
              <ArrowLeftRight className="w-5 h-5" />
              {comparedCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-400 text-slate-950 font-black text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 shadow-xs">
                  {comparedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">Compare</span>
          </button>
        )}

        {/* Bookings / Dashboard Tab */}
        <button
          type="button"
          onClick={() => onTabChange(currentUser?.role === 'landlord' ? 'dashboard' : 'bookings')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'bookings' || currentTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
          }`}
        >
          <div className="relative p-1">
            {currentUser?.role === 'landlord' ? (
              <Building className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'scale-110 stroke-[2.5]' : ''}`} />
            ) : (
              <Calendar className={`w-5 h-5 transition-transform ${currentTab === 'bookings' ? 'scale-110 stroke-[2.5]' : ''}`} />
            )}
            {bookingsCount > 0 && currentUser?.role !== 'landlord' && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white font-black text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 shadow-xs">
                {bookingsCount}
              </span>
            )}
            {(currentTab === 'bookings' || currentTab === 'dashboard') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {currentUser?.role === 'landlord' ? 'Dashboard' : 'Bookings'}
          </span>
        </button>

        {/* Profile / Menu Tab */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
        >
          <div className="p-1">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center uppercase shadow-2xs">
              {currentUser?.name ? currentUser.name.slice(0, 1) : 'G'}
            </div>
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
}
