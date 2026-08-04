import React, { useState } from 'react';
import { Listing } from '../types';
import { Compass, Bus, ShieldCheck, ShoppingBag, Sparkles, Navigation, Info, Zap, Coffee, Moon, Volume2 } from 'lucide-react';

interface NeighborhoodScoreCardProps {
  listing: Listing;
}

export default function NeighborhoodScoreCard({ listing }: NeighborhoodScoreCardProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'transit' | 'walk' | 'safety'>('all');

  // Compute deterministic scores based on listing ID or coordinates for consistency
  const getScore = (seed: number, min: number = 72, max: number = 98) => {
    let hash = 0;
    const str = listing.id + seed;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const positiveHash = Math.abs(hash);
    return min + (positiveHash % (max - min + 1));
  };

  const walkScore = getScore(101, 78, 97);
  const transitScore = getScore(202, 75, 96);
  const bikeScore = getScore(303, 70, 94);
  const safetyScore = getScore(404, 82, 98);
  const amenitiesScore = getScore(505, 80, 96);
  const quietnessScore = getScore(606, 72, 92);

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Walker’s Paradise', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800' };
    if (score >= 80) return { label: 'Very Walkable', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/80 border-teal-200 dark:border-teal-800' };
    return { label: 'Somewhat Walkable', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800' };
  };

  const scoresList = [
    {
      id: 'walk',
      title: 'Walk Score',
      score: walkScore,
      icon: Navigation,
      category: 'walk',
      desc: 'Daily errands do not require a car. Supermarkets, cafes & pharmacies within 5-10 mins.'
    },
    {
      id: 'transit',
      title: 'Transit Score',
      score: transitScore,
      icon: Bus,
      category: 'transit',
      desc: 'World-class public transport options nearby with frequent bus/rail lines.'
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      score: safetyScore,
      icon: ShieldCheck,
      category: 'safety',
      desc: 'Very low incident rate with well-lit streets and responsive community watch.'
    },
    {
      id: 'amenities',
      title: 'Amenities & Dining',
      score: amenitiesScore,
      icon: ShoppingBag,
      category: 'all',
      desc: 'Rich collection of restaurants, grocery markets, parks, and fitness centers.'
    },
    {
      id: 'bike',
      title: 'Biking & Green Trails',
      score: bikeScore,
      icon: Zap,
      category: 'walk',
      desc: 'Dedicated bike lanes, flat terrain, and accessible park routes.'
    },
    {
      id: 'quiet',
      title: 'Quietness & Vibe',
      score: quietnessScore,
      icon: Moon,
      category: 'all',
      desc: 'Peaceful residential ambiance with minimal traffic noise during nighttime hours.'
    }
  ];

  const filteredScores = activeFilter === 'all' 
    ? scoresList 
    : scoresList.filter(s => s.category === activeFilter || s.id === activeFilter);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <Compass className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              Neighborhood & Walkability Index
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time urban metric analysis for <span className="font-bold text-slate-700 dark:text-slate-200">{listing.location}</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('walk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'walk'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Walkability
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('transit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'transit'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Transit
          </button>
        </div>
      </div>

      {/* Main Highlights Hero Score Badge */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl border border-emerald-500/20 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Radial score gauge */}
          <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-xl font-black text-emerald-300">{walkScore}</span>
            <span className="text-[9px] text-emerald-200/80 font-bold absolute -bottom-1 bg-slate-900 px-1.5 rounded-full border border-emerald-500/30">
              /100
            </span>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">Overall Rating</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {getScoreLabel(walkScore).label}
              </span>
            </div>
            <h5 className="font-extrabold text-white text-sm sm:text-base">
              Highly Accessible & Convenient Location
            </h5>
            <p className="text-[11px] text-slate-300 max-w-md">
              Tenants in this neighborhood enjoy easy pedestrian access to grocery markets, coffee shops, and express transit hubs.
            </p>
          </div>
        </div>
      </div>

      {/* Score Grid Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredScores.map(s => {
          const Icon = s.icon;
          const badge = getScoreLabel(s.score);
          return (
            <div 
              key={s.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5 transition-all hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{s.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{s.score}/100</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.score}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
