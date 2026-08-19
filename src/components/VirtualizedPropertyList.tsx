import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Listing } from '../types';
import PropertyCard from './PropertyCard';
import { motion } from 'motion/react';

export interface PropertyFeedItem {
  listing: Listing;
  distanceKm?: number | null;
}

interface VirtualizedPropertyListProps {
  items: PropertyFeedItem[];
  displayCurrency: string;
  selectedListingId?: string | null;
  onSelectListing: (listing: Listing) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  comparedListingIds: string[];
  onToggleCompare: (listing: Listing, e: React.MouseEvent) => void;
  mapViewMode: 'split' | 'grid' | 'map';
  overscanRows?: number;
  estimatedRowHeight?: number;
}

export default function VirtualizedPropertyList({
  items,
  displayCurrency,
  selectedListingId,
  onSelectListing,
  favorites,
  onToggleFavorite,
  comparedListingIds,
  onToggleCompare,
  mapViewMode,
  overscanRows = 2,
  estimatedRowHeight = 440
}: VirtualizedPropertyListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(700);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Measure container dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      if (container) {
        setContainerHeight(container.clientHeight || 700);
        setContainerWidth(container.clientWidth || 1000);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Determine columns dynamically based on width & mapViewMode
  const columnCount = useMemo(() => {
    if (mapViewMode === 'map') return 1;
    if (mapViewMode === 'grid') {
      if (containerWidth >= 1200) return 4;
      if (containerWidth >= 880) return 3;
      if (containerWidth >= 580) return 2;
      return 1;
    }
    // 'split' mode
    if (containerWidth >= 760) return 2;
    return 1;
  }, [containerWidth, mapViewMode]);

  // Group items into rows
  const rows = useMemo(() => {
    const result: PropertyFeedItem[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
      result.push(items.slice(i, i + columnCount));
    }
    return result;
  }, [items, columnCount]);

  // Handle scroll events with RAF throttling for high FPS
  const rafId = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    });
  }, []);

  // Calculate visible row slice
  const totalRows = rows.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / estimatedRowHeight) - overscanRows);
  const endIndex = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / estimatedRowHeight) + overscanRows
  );

  const visibleRows = rows.slice(startIndex, endIndex);
  const paddingTop = startIndex * estimatedRowHeight;
  const paddingBottom = Math.max(0, (totalRows - endIndex) * estimatedRowHeight);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-auto pr-1 scrollbar-thin select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
        <div className="space-y-4">
          {visibleRows.map((row, rowIdx) => {
            const actualRowIndex = startIndex + rowIdx;
            return (
              <div
                key={`row-${actualRowIndex}`}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
                }}
              >
                {row.map(({ listing, distanceKm }) => (
                  <div key={listing.id} className="min-w-0">
                    <PropertyCard
                      listing={listing}
                      distanceKm={distanceKm}
                      displayCurrency={displayCurrency}
                      isSelected={selectedListingId === listing.id}
                      onClick={() => onSelectListing(listing)}
                      isFavorited={favorites.includes(listing.id)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(listing.id, e);
                      }}
                      isCompared={comparedListingIds.includes(listing.id)}
                      onToggleCompare={(e) => {
                        e.stopPropagation();
                        onToggleCompare(listing, e);
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
