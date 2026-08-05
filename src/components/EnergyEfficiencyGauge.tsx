import React, { useState } from 'react';
import { Listing } from '../types';
import { Zap, Leaf, Sun, Thermometer, Gauge, Lightbulb, Info, ShieldCheck, TrendingDown, DollarSign, Sparkles } from 'lucide-react';
import { formatCurrencyAmount, convertUSDToCurrency, SUPPORTED_CURRENCIES } from '../utils/currency';

interface EnergyEfficiencyGaugeProps {
  listing: Listing;
  displayCurrency?: string;
}

type EnergyClass = 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

interface EnergyClassConfig {
  code: EnergyClass;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  kwhRange: string;
  ecoSavingsPct: number;
}

const ENERGY_CLASSES: EnergyClassConfig[] = [
  { code: 'A+++', label: 'Ultra High Efficiency', color: 'bg-emerald-600', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-600', textColor: 'text-emerald-700', kwhRange: '< 45 kWh/m²/yr', ecoSavingsPct: 65 },
  { code: 'A++', label: 'Exceptional Efficiency', color: 'bg-emerald-500', bgColor: 'bg-emerald-400', borderColor: 'border-emerald-500', textColor: 'text-emerald-700', kwhRange: '45 - 70 kWh/m²/yr', ecoSavingsPct: 55 },
  { code: 'A+', label: 'Superior Green Efficiency', color: 'bg-emerald-400', bgColor: 'bg-emerald-300', borderColor: 'border-emerald-400', textColor: 'text-emerald-800', kwhRange: '70 - 95 kWh/m²/yr', ecoSavingsPct: 45 },
  { code: 'A', label: 'High Energy Efficiency', color: 'bg-green-500', bgColor: 'bg-green-400', borderColor: 'border-green-500', textColor: 'text-green-800', kwhRange: '95 - 120 kWh/m²/yr', ecoSavingsPct: 35 },
  { code: 'B', label: 'Good Standard Efficiency', color: 'bg-lime-500', bgColor: 'bg-lime-400', borderColor: 'border-lime-500', textColor: 'text-lime-800', kwhRange: '120 - 160 kWh/m²/yr', ecoSavingsPct: 25 },
  { code: 'C', label: 'Moderate Efficiency', color: 'bg-yellow-500', bgColor: 'bg-yellow-400', borderColor: 'border-yellow-500', textColor: 'text-yellow-800', kwhRange: '160 - 210 kWh/m²/yr', ecoSavingsPct: 15 },
  { code: 'D', label: 'Average Building Grade', color: 'bg-amber-500', bgColor: 'bg-amber-400', borderColor: 'border-amber-500', textColor: 'text-amber-800', kwhRange: '210 - 270 kWh/m²/yr', ecoSavingsPct: 5 },
  { code: 'E', label: 'Below Average Efficiency', color: 'bg-orange-500', bgColor: 'bg-orange-400', borderColor: 'border-orange-500', textColor: 'text-orange-800', kwhRange: '270 - 340 kWh/m²/yr', ecoSavingsPct: 0 },
  { code: 'F', label: 'Low Efficiency', color: 'bg-rose-500', bgColor: 'bg-rose-400', borderColor: 'border-rose-500', textColor: 'text-rose-800', kwhRange: '340 - 420 kWh/m²/yr', ecoSavingsPct: -15 },
  { code: 'G', label: 'Inefficient Energy Loss', color: 'bg-red-700', bgColor: 'bg-red-600', borderColor: 'border-red-700', textColor: 'text-red-800', kwhRange: '> 420 kWh/m²/yr', ecoSavingsPct: -30 },
];

export default function EnergyEfficiencyGauge({ listing, displayCurrency = 'regional' }: EnergyEfficiencyGaugeProps) {
  const [season, setSeason] = useState<'summer' | 'standard' | 'winter'>('standard');

  // Resolve listing's effective rating
  const effectiveRating: EnergyClass = listing.energyRating || (
    listing.solarPowered ? 'A+' :
    listing.amenities?.some(a => a.toLowerCase().includes('inverter') || a.toLowerCase().includes('solar')) ? 'A' :
    listing.type === 'duplex' || listing.type === 'villa' ? 'A++' : 'B'
  );

  const activeRatingConfig = ENERGY_CLASSES.find(c => c.code === effectiveRating) || ENERGY_CLASSES[3];

  // Utility calculation based on size & rating
  const baseUtilityUSD = listing.estimatedMonthlyUtilitiesUSD || Math.max(35, Math.round(listing.size * 0.85));
  
  // Seasonal multiplier
  const seasonalMultiplier = season === 'summer' ? 1.35 : season === 'winter' ? 1.2 : 1.0;
  const currentUtilityUSD = Math.round(baseUtilityUSD * seasonalMultiplier);

  // Target currency formatting
  const targetCurrencyCode = displayCurrency === 'regional' ? (listing.currency || 'USD') : displayCurrency;
  const utilityAmountLocal = convertUSDToCurrency(currentUtilityUSD, targetCurrencyCode);
  const formattedUtility = formatCurrencyAmount(utilityAmountLocal, targetCurrencyCode);

  // Compare against city average building without eco optimizations (+40% higher)
  const averageCityUtilityUSD = Math.round(baseUtilityUSD * 1.45 * seasonalMultiplier);
  const averageCityUtilityLocal = convertUSDToCurrency(averageCityUtilityUSD, targetCurrencyCode);
  const formattedCityAverage = formatCurrencyAmount(averageCityUtilityLocal, targetCurrencyCode);

  const monthlySavingsLocal = convertUSDToCurrency(Math.max(15, averageCityUtilityUSD - currentUtilityUSD), targetCurrencyCode);
  const formattedMonthlySavings = formatCurrencyAmount(monthlySavingsLocal, targetCurrencyCode);
  const annualSavingsFormatted = formatCurrencyAmount(monthlySavingsLocal * 12, targetCurrencyCode);

  // Estimated Utility Breakdown
  const electricityPct = listing.solarPowered ? 35 : 55;
  const waterPct = 20;
  const coolingHeatingPct = listing.solarPowered ? 25 : 35;
  const rubbishOtherPct = 10;

  const elecAmt = formatCurrencyAmount(Math.round(utilityAmountLocal * (electricityPct / 100)), targetCurrencyCode);
  const waterAmt = formatCurrencyAmount(Math.round(utilityAmountLocal * (waterPct / 100)), targetCurrencyCode);
  const hvacAmt = formatCurrencyAmount(Math.round(utilityAmountLocal * (coolingHeatingPct / 100)), targetCurrencyCode);

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <span>Energy Efficiency & Utility Transparency</span>
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Certified EPC rating & transparent monthly utility cost expectations
          </p>
        </div>

        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto shrink-0">
          <Leaf className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/30" />
          <span>Eco-Verified Property</span>
        </span>
      </div>

      {/* Main Gauge Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
        {/* Rating Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${activeRatingConfig.bgColor} text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0 border-2 border-white/20`}>
              {activeRatingConfig.code}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  Energy Rating: Grade {activeRatingConfig.code}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md border border-slate-700">
                  {activeRatingConfig.kwhRange}
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {activeRatingConfig.label}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-xl text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Est. Utility Bills</span>
            <div className="text-lg font-black text-emerald-400 leading-tight">
              {formattedUtility} <span className="text-xs font-semibold text-slate-300">/mo</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-medium block mt-0.5">
              Saves ~{formattedMonthlySavings}/mo vs avg
            </span>
          </div>
        </div>

        {/* Visual EPC Energy Spectrum Bar Indicator */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <span className="text-emerald-400 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> A+++ Ultra Eco
            </span>
            <span>Standard Utility Efficiency Spectrum</span>
            <span className="text-rose-400">G High Loss</span>
          </div>

          {/* Spectrum Bar with Arrow Pointer */}
          <div className="relative pt-2 pb-1">
            <div className="grid grid-cols-10 gap-0.5 h-3.5 rounded-lg overflow-hidden bg-slate-800 p-0.5 border border-slate-700">
              {ENERGY_CLASSES.map((cls) => {
                const isActive = cls.code === activeRatingConfig.code;
                return (
                  <div
                    key={cls.code}
                    title={`Grade ${cls.code}: ${cls.label}`}
                    className={`h-full rounded-xs transition-all relative ${cls.bgColor} ${
                      isActive ? 'ring-2 ring-white scale-y-110 z-10 shadow-md' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className="hidden sm:block text-[8px] font-black text-slate-950 text-center leading-3">
                      {cls.code}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active Class Pointer Callout */}
            <div className="mt-2 flex items-center justify-between bg-slate-800/90 border border-slate-700/70 p-2.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/30 shrink-0" />
                <span className="text-slate-300 text-[11px] font-medium">
                  This property is optimized with <strong className="text-white font-bold">{listing.solarPowered ? 'Solar PV array & Inverter backup' : listing.hvacType || 'Inverter HVAC insulation'}</strong>, resulting in <strong className="text-emerald-400 font-bold">{activeRatingConfig.ecoSavingsPct}% lower energy waste</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seasonal Selector & Monthly Utility Breakdown */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <span className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>Seasonal Utility Estimator</span>
            </span>

            {/* Season Selector */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
              {[
                { id: 'standard', label: 'Spring/Autumn', icon: Leaf },
                { id: 'summer', label: 'Summer Peak AC', icon: Sun },
                { id: 'winter', label: 'Winter Heating', icon: Thermometer },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeason(s.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      season === s.id
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breakdown Items Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Electricity</span>
              </div>
              <span className="font-extrabold text-white text-xs sm:text-sm">{elecAmt}</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                <Thermometer className="w-3 h-3 text-cyan-400" />
                <span>HVAC AC/Heat</span>
              </div>
              <span className="font-extrabold text-white text-xs sm:text-sm">{hvacAmt}</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Water & Service</span>
              </div>
              <span className="font-extrabold text-white text-xs sm:text-sm">{waterAmt}</span>
            </div>
          </div>
        </div>

        {/* Eco Features Pill Tags */}
        <div className="pt-1 flex flex-wrap gap-1.5">
          {listing.solarPowered && (
            <span className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" /> Solar PV Inverter
            </span>
          )}
          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" /> Inverter AC Units
          </span>
          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" /> Double-Glazed Insulation
          </span>
          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-300" /> 100% LED Lighting
          </span>
        </div>
      </div>
    </div>
  );
}
