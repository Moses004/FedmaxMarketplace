import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calculator, DollarSign, PieChart, ArrowRight, ShieldCheck, HelpCircle, CheckCircle2, Sparkles, Sliders, TrendingUp, Wallet, Home, AlertCircle } from 'lucide-react';
import { SUPPORTED_CURRENCIES, formatCurrencyAmount, convertUSDToCurrency, convertCurrencyToUSD } from '../utils/currency';

interface RentAffordabilityCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCurrency: string;
  onApplyBudgetToFilter: (maxBudgetUSD: number) => void;
}

export default function RentAffordabilityCalculatorModal({
  isOpen,
  onClose,
  userCurrency,
  onApplyBudgetToFilter
}: RentAffordabilityCalculatorModalProps) {
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(userCurrency || 'USD');
  const [incomeType, setIncomeType] = useState<'monthly' | 'annual'>('monthly');
  const [incomeAmount, setIncomeAmount] = useState<number>(
    selectedCurrencyCode === 'NGN' ? 1500000 : selectedCurrencyCode === 'GBP' || selectedCurrencyCode === 'EUR' ? 4500 : 6000
  );
  const [targetRatio, setTargetRatio] = useState<number>(30); // 30% rule is standard
  const [monthlyDebts, setMonthlyDebts] = useState<number>(0);
  const [includeMoveInEstimator, setIncludeMoveInEstimator] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentCurrency = SUPPORTED_CURRENCIES[selectedCurrencyCode] || SUPPORTED_CURRENCIES.USD;

  // Convert to monthly gross income
  const monthlyGross = incomeType === 'annual' ? incomeAmount / 12 : incomeAmount;

  // Calculate recommended max rent (before debts)
  const grossRecommendedRent = (monthlyGross * targetRatio) / 100;

  // Deduct debts from capacity
  const netAffordableRent = Math.max(0, grossRecommendedRent - monthlyDebts * 0.5);

  // Convert net affordable rent to USD for search filter
  const maxBudgetUSD = Math.round(convertCurrencyToUSD(netAffordableRent, selectedCurrencyCode));

  // Move-in upfront cost estimation (Security deposit + 1st month rent + agency/legal fee estimate)
  const firstMonthRent = netAffordableRent;
  const securityDeposit = netAffordableRent * 1.5; // Typical 1.5 months deposit
  const agencyLegalFee = netAffordableRent * 0.5; // Typical 50% one-off fee
  const totalMoveInBudget = firstMonthRent + securityDeposit + agencyLegalFee;

  // Percentage breakdown for visualization
  const rentPercent = monthlyGross > 0 ? Math.min(100, Math.round((netAffordableRent / monthlyGross) * 100)) : 0;
  const debtPercent = monthlyGross > 0 ? Math.min(100 - rentPercent, Math.round((monthlyDebts / monthlyGross) * 100)) : 0;
  const savingsPercent = Math.max(0, 100 - rentPercent - debtPercent);

  const handleApplyFilter = () => {
    onApplyBudgetToFilter(maxBudgetUSD);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Rent Affordability Calculator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Estimate your comfortable monthly rent &amp; total move-in budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency & Income Mode Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Currency
            </label>
            <select
              value={selectedCurrencyCode}
              onChange={(e) => setSelectedCurrencyCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Income Period
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setIncomeType('monthly')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  incomeType === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Monthly Salary
              </button>
              <button
                type="button"
                onClick={() => setIncomeType('annual')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  incomeType === 'annual'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Annual Salary
              </button>
            </div>
          </div>
        </div>

        {/* Salary & Debts Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {incomeType === 'monthly' ? 'Monthly Gross Income' : 'Annual Gross Income'} ({currentCurrency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Monthly Existing Debts / Loans ({currentCurrency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={monthlyDebts}
                onChange={(e) => setMonthlyDebts(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Rent to Income Ratio Slider */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>Rent-to-Income Comfort Ratio:</span>
                <span className="text-emerald-600 font-black">{targetRatio}%</span>
              </span>
              <span className="text-[11px] text-slate-500 block">
                {targetRatio <= 25 ? 'Conservative & Highly Safe' : targetRatio <= 30 ? 'Recommended Standard (30% Rule)' : targetRatio <= 35 ? 'Moderate Rent Allowance' : 'Maximum Stretch Budget'}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {formatCurrencyAmount(netAffordableRent, selectedCurrencyCode)} / month
            </span>
          </div>

          <input
            type="range"
            min="15"
            max="45"
            step="1"
            value={targetRatio}
            onChange={(e) => setTargetRatio(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>15% (Strict Thrift)</span>
            <span>25% (Safe)</span>
            <span>30% (Standard)</span>
            <span>35% (Moderate)</span>
            <span>45% (Max Limit)</span>
          </div>
        </div>

        {/* Results Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-100 block">
                Your Affordable Monthly Rent
              </span>
              <div className="text-2xl sm:text-3xl font-black mt-0.5">
                {formatCurrencyAmount(netAffordableRent, selectedCurrencyCode)}
                <span className="text-xs font-semibold text-emerald-100 ml-1.5">/ month</span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1">
                Equivalent to approximately <strong>${maxBudgetUSD.toLocaleString()} USD</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyFilter}
              className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Apply to Search Filters</span>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </button>
          </div>

          {/* Visual Income Distribution Bar */}
          <div className="space-y-1.5 pt-2 border-t border-emerald-500/40">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-100">
              <span>Income Allocation Breakdown</span>
              <span>100% of Monthly Gross</span>
            </div>
            <div className="h-3 w-full bg-emerald-950/40 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${rentPercent}%` }}
                className="h-full bg-white transition-all"
                title={`Rent Budget: ${rentPercent}%`}
              />
              <div
                style={{ width: `${debtPercent}%` }}
                className="h-full bg-amber-400 transition-all"
                title={`Other Debts: ${debtPercent}%`}
              />
              <div
                style={{ width: `${savingsPercent}%` }}
                className="h-full bg-emerald-400 transition-all"
                title={`Remaining Savings/Expenses: ${savingsPercent}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white inline-block" />
                <span>Rent ({rentPercent}%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Debts ({debtPercent}%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Savings &amp; Life ({savingsPercent}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Move-in Cost Estimator Accordion */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <button
            type="button"
            onClick={() => setIncludeMoveInEstimator(!includeMoveInEstimator)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                Estimated Total Move-in Cash Required
              </span>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white">
              {formatCurrencyAmount(totalMoveInBudget, selectedCurrencyCode)}
            </span>
          </button>

          {includeMoveInEstimator && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 block">1st Month Rent</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {formatCurrencyAmount(firstMonthRent, selectedCurrencyCode)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 block">Security Deposit (~1.5x)</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {formatCurrencyAmount(securityDeposit, selectedCurrencyCode)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 block">Agency &amp; Legal Fee (~50%)</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {formatCurrencyAmount(agencyLegalFee, selectedCurrencyCode)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer tips */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 Tip: Rentora never charges booking fees or hidden tenant markups.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
