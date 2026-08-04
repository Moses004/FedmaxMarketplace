import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, DollarSign, ArrowRightLeft, Check, Globe, Calculator, Sparkles, TrendingUp, Info } from 'lucide-react';
import { SUPPORTED_CURRENCIES, convertUSDToCurrency, convertCurrencyToUSD, formatCurrencyAmount, CurrencyInfo } from '../utils/currency';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCurrency: string;
  onSelectCurrency: (code: string) => void;
}

export default function CurrencyConverterModal({
  isOpen,
  onClose,
  activeCurrency,
  onSelectCurrency
}: CurrencyConverterModalProps) {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>(activeCurrency || 'NGN');
  const [amount, setAmount] = useState<number>(1500); // Default 1,500 USD monthly rent

  if (!isOpen) return null;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Calculation logic
  const usdValue = convertCurrencyToUSD(amount, fromCurrency);
  const convertedAmount = convertUSDToCurrency(usdValue, toCurrency);

  const popularPresetAmounts = [500, 1000, 1500, 2500, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Rentora FX Currency Calculator</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Real-time Rates
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Convert rental budgets across 13+ global currencies with transparent rate benchmarks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Quick Active Display Currency Setting */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Your App Display Currency</h3>
                <p className="text-[11px] text-slate-600">
                  Currently set to <strong className="text-emerald-800 font-bold">{SUPPORTED_CURRENCIES[activeCurrency]?.name} ({activeCurrency})</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AED'].map((code) => {
                const isSelected = activeCurrency === code;
                const info = SUPPORTED_CURRENCIES[code];
                return (
                  <button
                    key={code}
                    onClick={() => onSelectCurrency(code)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{info?.flag}</span>
                    <span>{code}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive FX Converter Engine */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
              Custom Rent Conversion Calculator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              {/* From Input */}
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Source Amount & Currency</label>
                <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                  <input
                    type="number"
                    min="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none"
                    placeholder="Enter amount"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="bg-slate-100 border-l border-slate-200 px-2.5 py-2.5 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex justify-center py-1">
                <button
                  onClick={handleSwap}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all active:scale-95"
                  title="Swap source and target currency"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To Result */}
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Target Converted Amount</label>
                <div className="flex items-center border border-slate-200 bg-emerald-50/50 rounded-xl overflow-hidden">
                  <div className="w-full px-3 py-2.5 text-sm font-black text-emerald-800 truncate">
                    {formatCurrencyAmount(convertedAmount, toCurrency)}
                  </div>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="bg-slate-100 border-l border-slate-200 px-2.5 py-2.5 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Rent Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">Quick Rent Presets:</span>
              {popularPresetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setFromCurrency('USD');
                    setAmount(preset);
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-all"
                >
                  ${preset.toLocaleString()}/mo
                </button>
              ))}
            </div>

            {/* Benchmark Note */}
            <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Rate Benchmark: <strong>1 USD = {SUPPORTED_CURRENCIES[toCurrency]?.rateToUSD} {toCurrency}</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Universal USD Baseline</span>
            </div>
          </div>

          {/* Supported Global Currencies Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Supported Regional Currencies ({Object.keys(SUPPORTED_CURRENCIES).length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {Object.values(SUPPORTED_CURRENCIES).map((c) => {
                const isCurrentGlobal = activeCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => onSelectCurrency(c.code)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isCurrentGlobal
                        ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{c.flag}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isCurrentGlobal ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.code}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-black text-slate-800">{c.name}</div>
                      <div className="text-[11px] font-bold text-slate-400">
                        {c.symbol} (Rate: {c.rateToUSD})
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <p className="text-[11px] font-medium text-slate-500">
            Rentora auto-detects your location & profile settings to default your display.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
          >
            Done
          </button>
        </div>

      </motion.div>
    </div>
  );
}
