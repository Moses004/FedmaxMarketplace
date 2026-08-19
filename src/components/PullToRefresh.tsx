import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  isRefreshing?: boolean;
  className?: string;
  pullThreshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  isRefreshing = false,
  className = '',
  pullThreshold = 65
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [internalRefreshing, setInternalRefreshing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  const activeRefreshing = isRefreshing || internalRefreshing;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling.current || activeRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply elastic damping resistance
      const dampedDistance = Math.min(diff * 0.45, pullThreshold * 1.5);
      setPullDistance(dampedDistance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || activeRefreshing) return;
    isPulling.current = false;

    if (pullDistance >= pullThreshold) {
      setInternalRefreshing(true);
      setPullDistance(pullThreshold);
      try {
        await onRefresh();
      } catch (err) {
        console.error('Pull to refresh error:', err);
      } finally {
        setTimeout(() => {
          setInternalRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / pullThreshold, 1);
  const isReadyToRelease = pullDistance >= pullThreshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-y-auto scrollbar-thin ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull Indicator Banner */}
      <AnimatePresence>
        {(pullDistance > 0 || activeRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: activeRefreshing ? 50 : Math.max(pullDistance, 0)
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="flex items-center justify-center overflow-hidden bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 py-1 select-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {activeRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <span className="text-emerald-700 dark:text-emerald-300">Syncing live properties from Supabase...</span>
                </>
              ) : isReadyToRelease ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <span className="text-indigo-700 dark:text-indigo-300">Release to sync latest listings</span>
                </>
              ) : (
                <>
                  <ArrowDown
                    className="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-150"
                    style={{ transform: `rotate(${progress * 180}deg)` }}
                  />
                  <span className="text-slate-500 dark:text-slate-400">
                    Pull down to refresh ({Math.round(progress * 100)}%)
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Feed Content */}
      <div
        style={{
          transform: !activeRefreshing && pullDistance > 0 ? `translateY(${pullDistance * 0.15}px)` : 'none',
          transition: isPulling.current ? 'none' : 'transform 0.25s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
