import React, { useEffect, useState, useRef } from 'react';
import { formatCurrencyAmount } from '../utils/currency';

interface AnimatedPriceCounterProps {
  value: number;
  currencyCode?: string;
  duration?: number;
  className?: string;
  options?: { compact?: boolean; hideDecimals?: boolean };
  prefix?: string;
  suffix?: string;
}

export default function AnimatedPriceCounter({
  value,
  currencyCode = 'USD',
  duration = 500,
  className = '',
  options,
  prefix = '',
  suffix = '',
}: AnimatedPriceCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(() => Math.round(value));
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const startValueRef = useRef<number>(Math.round(value));
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const target = Math.round(value);
    const start = displayValue;

    if (start === target) return;

    setIsAnimating(true);
    startValueRef.current = start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = formatCurrencyAmount(displayValue, currencyCode, options);

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        isAnimating ? 'scale-[1.03] text-emerald-600 dark:text-emerald-400 font-extrabold' : ''
      } ${className}`}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
