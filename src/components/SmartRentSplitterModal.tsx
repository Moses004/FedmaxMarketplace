import React, { useState } from 'react';
import { Listing } from '../types';
import { X, Calculator, Users, DollarSign, Sparkles, Copy, Check, Info, ShieldCheck, Share2, Layers } from 'lucide-react';
import { formatCurrencyAmount, getListingPrices } from '../utils/currency';
import { motion } from 'motion/react';

interface SmartRentSplitterModalProps {
  listing: Listing;
  onClose: () => void;
  displayCurrency?: string;
}

interface RoomConfig {
  id: string;
  name: string;
  sqm: number;
  hasPrivateBathroom: boolean;
  hasBalcony: boolean;
  isMaster: boolean;
}

export default function SmartRentSplitterModal({
  listing,
  onClose,
  displayCurrency = 'regional'
}: SmartRentSplitterModalProps) {
  const prices = getListingPrices(listing);
  const baseMonthlyRent = displayCurrency === 'usd' ? prices.priceUSD : prices.localPrice;
  const currencySymbol = displayCurrency === 'usd' ? '$' : `${prices.primaryCode} `;

  // Utilities state (per month)
  const [wifiCost, setWifiCost] = useState<number>(40);
  const [electricityCost, setElectricityCost] = useState<number>(80);
  const [waterCost, setWaterCost] = useState<number>(30);
  const [trashCost, setTrashCost] = useState<number>(15);
  const [splitMethod, setSplitMethod] = useState<'perks' | 'even' | 'size'>('perks');
  const [copied, setCopied] = useState(false);

  // Keyboard Escape listener
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Default room initialization based on property bedrooms
  const numBedrooms = Math.max(2, listing.bedrooms || 2);

  const [rooms, setRooms] = useState<RoomConfig[]>(() => {
    return Array.from({ length: numBedrooms }).map((_, idx) => ({
      id: `room-${idx + 1}`,
      name: idx === 0 ? 'Master Suite' : `Bedroom ${idx + 1}`,
      sqm: Math.max(10, Math.round((listing.size || 60) / numBedrooms + (idx === 0 ? 5 : -2))),
      hasPrivateBathroom: idx === 0 || idx < listing.bathrooms - 1,
      hasBalcony: idx === 0,
      isMaster: idx === 0,
    }));
  });

  const totalUtilities = wifiCost + electricityCost + waterCost + trashCost;

  // Calculation Logic
  const calculateSplits = () => {
    const roomCount = rooms.length;
    if (roomCount === 0) return [];

    if (splitMethod === 'even') {
      const perRoomRent = baseMonthlyRent / roomCount;
      const perRoomUtility = totalUtilities / roomCount;
      return rooms.map(r => ({
        ...r,
        rentShare: perRoomRent,
        utilityShare: perRoomUtility,
        totalShare: perRoomRent + perRoomUtility,
        percent: 100 / roomCount
      }));
    }

    if (splitMethod === 'size') {
      const totalSqm = rooms.reduce((acc, r) => acc + (r.sqm || 1), 0);
      return rooms.map(r => {
        const ratio = (r.sqm || 1) / totalSqm;
        const rentShare = baseMonthlyRent * ratio;
        const utilityShare = totalUtilities / roomCount;
        return {
          ...r,
          rentShare,
          utilityShare,
          totalShare: rentShare + utilityShare,
          percent: ratio * 100
        };
      });
    }

    // Perks weighted calculation
    // Base weight per room = 100
    // +20 for Master, +25 for Private Bath, +15 for Balcony, +0.5 per sqm over average
    const avgSqm = rooms.reduce((acc, r) => acc + r.sqm, 0) / roomCount;
    const roomWeights = rooms.map(r => {
      let weight = 100;
      if (r.isMaster) weight += 20;
      if (r.hasPrivateBathroom) weight += 25;
      if (r.hasBalcony) weight += 15;
      const sqmDiff = r.sqm - avgSqm;
      weight += sqmDiff * 2;
      return Math.max(50, weight);
    });

    const totalWeight = roomWeights.reduce((acc, w) => acc + w, 0);

    return rooms.map((r, idx) => {
      const weight = roomWeights[idx];
      const ratio = weight / totalWeight;
      const rentShare = baseMonthlyRent * ratio;
      const utilityShare = totalUtilities / roomCount;
      return {
        ...r,
        rentShare,
        utilityShare,
        totalShare: rentShare + utilityShare,
        percent: ratio * 100
      };
    });
  };

  const calculatedRooms = calculateSplits();
  const grandTotal = baseMonthlyRent + totalUtilities;

  const handleRoomChange = (id: string, field: keyof RoomConfig, value: any) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCopyBreakdown = () => {
    const textLines = [
      `🏡 Roommate Rent & Utility Split - ${listing.title}`,
      `Total Rent: ${currencySymbol}${baseMonthlyRent.toLocaleString()}/mo`,
      `Estimated Utilities (Wifi, Elec, Water, Trash): ${currencySymbol}${totalUtilities.toLocaleString()}/mo`,
      `Grand Total: ${currencySymbol}${grandTotal.toLocaleString()}/mo`,
      `----------------------------------------`,
      ...calculatedRooms.map((r, i) => 
        `Room ${i + 1} (${r.name}): ${currencySymbol}${Math.round(r.totalShare).toLocaleString()}/mo ` +
        `[Rent: ${currencySymbol}${Math.round(r.rentShare).toLocaleString()} | Utils: ${currencySymbol}${Math.round(r.utilityShare).toLocaleString()}]`
      ),
      `----------------------------------------`,
      `Calculated via Rentora Smart Splitter`
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-splitter-title"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto my-6 text-slate-900 dark:text-slate-100"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Calculator className="w-3.5 h-3.5" />
                <span>Smart Roommate Estimator</span>
              </div>
              <h3 id="smart-splitter-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Rent & Utility Cost Splitter
              </h3>
              <p className="text-xs text-slate-300 max-w-lg">
                Fairly divide rent based on room size, private bathrooms, balconies, and estimated utility bills for <span className="text-emerald-300 font-bold">{listing.title}</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
              aria-label="Close rent splitter modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Split Strategy Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Splitting Strategy</span>
            </label>

            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSplitMethod('perks')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMethod === 'perks'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fair Perks & Size</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMethod('size')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMethod === 'size'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>By Room Area (m²)</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMethod('even')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMethod === 'even'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Equal Split</span>
              </button>
            </div>
          </div>

          {/* Rooms Customizer Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bedrooms & Amenities Configuration ({rooms.length} Rooms)
              </span>
              <button
                type="button"
                onClick={() => setRooms(prev => [...prev, {
                  id: `room-${prev.length + 1}`,
                  name: `Bedroom ${prev.length + 1}`,
                  sqm: 12,
                  hasPrivateBathroom: false,
                  hasBalcony: false,
                  isMaster: false
                }])}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                + Add Roommate Room
              </button>
            </div>

            <div className="space-y-3">
              {rooms.map((room, idx) => {
                const calculated = calculatedRooms.find(r => r.id === room.id);
                return (
                  <div 
                    key={room.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 transition-all hover:border-emerald-500/40"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleRoomChange(room.id, 'name', e.target.value)}
                          className="font-extrabold text-sm text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none px-1 py-0.5"
                        />
                      </div>

                      {calculated && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            Total Share:
                          </span>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {currencySymbol}{Math.round(calculated.totalShare).toLocaleString()}
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Room Size (m²)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={100}
                          value={room.sqm}
                          onChange={(e) => handleRoomChange(room.id, 'sqm', parseFloat(e.target.value) || 10)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold select-none">
                          <input
                            type="checkbox"
                            checked={room.hasPrivateBathroom}
                            onChange={(e) => handleRoomChange(room.id, 'hasPrivateBathroom', e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <span>Private Bath</span>
                        </label>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold select-none">
                          <input
                            type="checkbox"
                            checked={room.hasBalcony}
                            onChange={(e) => handleRoomChange(room.id, 'hasBalcony', e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <span>Balcony / Patio</span>
                        </label>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold select-none">
                          <input
                            type="checkbox"
                            checked={room.isMaster}
                            onChange={(e) => handleRoomChange(room.id, 'isMaster', e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <span>Master Suite</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared Utility Estimates */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Monthly Shared Utility Estimates ({currencySymbol}{totalUtilities.toLocaleString()}/mo)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  High-Speed Wifi
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    value={wifiCost}
                    onChange={(e) => setWifiCost(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Electricity / Power
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Water & Sewage
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    value={waterCost}
                    onChange={(e) => setWaterCost(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Trash / Disposal
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    value={trashCost}
                    onChange={(e) => setTrashCost(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Breakdown Summary */}
          <div className="bg-emerald-950 text-white p-5 rounded-2xl space-y-4 border border-emerald-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
              <div>
                <h4 className="font-extrabold text-base text-white">Final Monthly Roommate Allocation</h4>
                <p className="text-xs text-emerald-300">
                  Total Monthly Expenses: {currencySymbol}{grandTotal.toLocaleString()} ({currencySymbol}{baseMonthlyRent.toLocaleString()} Rent + {currencySymbol}{totalUtilities.toLocaleString()} Utilities)
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyBreakdown}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Breakdown for Roommates'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {calculatedRooms.map((r, i) => (
                <div key={r.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-100">{r.name} ({Math.round(r.percent)}% share)</span>
                    <span className="font-black text-emerald-300">
                      {currencySymbol}{Math.round(r.totalShare).toLocaleString()}/mo
                      <span className="text-[10px] text-emerald-400/80 font-normal ml-1">
                        (Rent: {currencySymbol}{Math.round(r.rentShare).toLocaleString()} | Utils: {currencySymbol}{Math.round(r.utilityShare).toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-emerald-900/60 rounded-full h-2.5 overflow-hidden border border-emerald-700/50">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, r.percent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Estimates apply to monthly occupancy & standard utility consumption.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </motion.div>
    </div>
  );
}
