import React, { useEffect, useState } from 'react';
import { Booking, User } from '../types';
import { Clock, AlertTriangle, CreditCard, Sparkles, CheckCircle2, ChevronRight, ShieldCheck, ArrowUpRight, BellRing } from 'lucide-react';
import { formatCurrencyAmount, convertUSDToCurrency } from '../utils/currency';
import { useToast } from '../context/ToastContext';

interface PaymentDueAlertBannerProps {
  booking: Booking;
  currentUser: User | null;
  displayCurrency?: string;
  onPayNow: (booking: Booking) => void;
}

export default function PaymentDueAlertBanner({
  booking,
  currentUser,
  displayCurrency = 'regional',
  onPayNow,
}: PaymentDueAlertBannerProps) {
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);

  // Determine currency representation
  const targetCurrency = displayCurrency === 'regional' ? 'NGN' : displayCurrency;
  const isAnnual = booking.billingCycle === 'annual';
  const priceAmount = booking.listingPrice;
  const periodLabel = isAnnual ? '/yr' : '/mo';

  const formattedAmount = formatCurrencyAmount(
    targetCurrency === 'USD' ? priceAmount : convertUSDToCurrency(priceAmount, targetCurrency),
    targetCurrency
  );

  // Proactive toast trigger on initial render for tenant
  useEffect(() => {
    const hasAlertedKey = `rentora_payment_alert_shown_${booking.id}`;
    const alreadyAlerted = sessionStorage.getItem(hasAlertedKey);

    if (!alreadyAlerted) {
      toast.warning(
        `Payment Due Alert: Rent Due in ${booking.paymentDueDaysLeft || 3} Days`,
        `Your ${isAnnual ? 'annual' : 'monthly'} rent payment of ${formattedAmount} for "${booking.listingTitle}" is due on ${booking.nextPaymentDueDate || 'Aug 8, 2026'}.`
      );
      sessionStorage.setItem(hasAlertedKey, 'true');
    }
  }, [booking.id]);

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-amber-400/30 mb-6 animate-fade-in">
      {/* Decorative Background Accent */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/25 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-200 fill-amber-200/40" />
                Payment Due Alert
              </span>
              <span className="bg-slate-950/40 text-amber-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Due in {booking.paymentDueDaysLeft || 3} Days ({booking.nextPaymentDueDate || 'Aug 8, 2026'})
              </span>
            </div>

            <h3 className="text-lg font-black text-white leading-tight drop-shadow-xs">
              Upcoming Rent Renewal Due
            </h3>

            <p className="text-xs text-amber-100 font-medium max-w-xl leading-relaxed">
              Your <strong className="text-white font-bold">{isAnnual ? 'Annual Rent' : 'Monthly Rent'}</strong> for{' '}
              <span className="underline decoration-amber-300 underline-offset-2 font-semibold text-white">
                {booking.listingTitle}
              </span>{' '}
              is due shortly. Pay before the due date to avoid service interruptions.
            </p>
          </div>
        </div>

        {/* Right Action Block */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/20">
          <div className="text-left sm:text-right md:text-left lg:text-right">
            <span className="text-[10px] text-amber-100 uppercase font-black tracking-wider block">Total Rent Due</span>
            <div className="text-xl font-black text-white leading-none">
              {formattedAmount} <span className="text-xs font-bold text-amber-200">{periodLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPayNow(booking)}
              className="px-5 py-3 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group shrink-0 active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Settle Rent Payment</span>
              <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
