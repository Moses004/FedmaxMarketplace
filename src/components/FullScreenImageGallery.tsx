import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, 
  Maximize2, Grid, Sparkles, Touchpad, Move
} from 'lucide-react';

interface FullScreenImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

export default function FullScreenImageGallery({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = 'Property Photos'
}: FullScreenImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchLastRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex >= 0 && initialIndex < images.length ? initialIndex : 0);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, images.length]);

  // Reset zoom & panning whenever slide changes
  const changeSlide = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= images.length) return;
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex(newIndex);
  }, [images.length]);

  const handleNext = useCallback(() => {
    changeSlide((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, changeSlide]);

  const handlePrev = useCallback(() => {
    changeSlide((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, changeSlide]);

  // Keyboard navigation & Esc key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(s + 0.5, 4));
      } else if (e.key === '-' || e.key === '_') {
        setScale(s => {
          const nextS = Math.max(s - 0.5, 1);
          if (nextS === 1) setPosition({ x: 0, y: 0 });
          return nextS;
        });
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Double tap to zoom handler
  const handleDoubleTap = (clientX: number, clientY: number) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
        // Center pan slightly toward tap
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = (centerX - clientX) * 0.8;
        const offsetY = (centerY - clientY) * 0.8;
        setPosition({ x: offsetX, y: offsetY });
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Touch Gesture Handlers (Pinch Zoom + Swiping + Panning)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      touchLastRef.current = { x: t.clientX, y: t.clientY };
      setIsPanning(scale > 1);
      handleDoubleTap(t.clientX, t.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      // Pinching
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const newScale = Math.min(Math.max(1, pinchStartScaleRef.current * (currentDist / pinchStartDistRef.current)), 4);
      
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && touchLastRef.current) {
      const t = e.touches[0];
      const deltaX = t.clientX - touchLastRef.current.x;
      const deltaY = t.clientY - touchLastRef.current.y;

      if (scale > 1) {
        // Pan around zoomed photo
        setPosition(prev => ({
          x: Math.max(Math.min(prev.x + deltaX, 400 * scale), -400 * scale),
          y: Math.max(Math.min(prev.y + deltaY, 400 * scale), -400 * scale)
        }));
      }
      touchLastRef.current = { x: t.clientX, y: t.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartDistRef.current = null;
    }

    if (e.touches.length === 0 && touchStartRef.current && scale === 1) {
      const touchEndObj = touchLastRef.current || touchStartRef.current;
      const deltaX = touchEndObj.x - touchStartRef.current.x;
      const deltaY = touchEndObj.y - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;

      // Swipe detection (horizontal swipe > 45px in under 500ms)
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) && duration < 500) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }

    touchStartRef.current = null;
    touchLastRef.current = null;
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.2 : -0.2;
    setScale(s => {
      const nextScale = Math.min(Math.max(1, s + zoomFactor), 4);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
      return nextScale;
    });
  };

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none touch-none overflow-hidden"
        onWheel={handleWheel}
      >
        {/* TOP HEADER CONTROLS */}
        <div className="relative z-30 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-white border border-white/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentIndex + 1} / {images.length}</span>
            </div>
            
            <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-extrabold text-emerald-300 border border-emerald-500/30">
              <Touchpad className="w-3.5 h-3.5" />
              <span>{scale.toFixed(1)}x Zoom</span>
            </div>

            {title && (
              <h3 className="hidden md:block text-xs font-bold text-slate-300 max-w-xs truncate">
                {title}
              </h3>
            )}
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 p-0.5">
              <button
                type="button"
                onClick={() => setScale(s => Math.min(s + 0.5, 4))}
                className="p-2 text-white hover:text-emerald-400 rounded-full transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setScale(s => {
                    const nextS = Math.max(s - 0.5, 1);
                    if (nextS === 1) setPosition({ x: 0, y: 0 });
                    return nextS;
                  });
                }}
                className="p-2 text-white hover:text-emerald-400 rounded-full transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {scale > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="p-2 text-emerald-400 hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Toggle Thumbnail Strip */}
            <button
              type="button"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                showThumbnails
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-white/10 text-slate-300 border-white/20 hover:text-white'
              }`}
              title="Toggle Thumbnails"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full backdrop-blur-md transition-all shadow-lg border border-rose-400/50 cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Close Fullscreen Gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN IMAGE DISPLAY CANVAS */}
        <div
          className="relative flex-1 flex items-center justify-center overflow-hidden touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Previous Button (Desktop/Click) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-30 p-3 sm:p-4 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 backdrop-blur-md transition-all shadow-2xl cursor-pointer hover:scale-110 active:scale-95 group"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Active Image with Pan & Zoom */}
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-8">
            <motion.img
              key={currentIndex}
              src={currentImage}
              alt={`${title} - Photo ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain pointer-events-auto rounded-lg shadow-2xl"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                cursor: scale > 1 ? 'grab' : 'pointer'
              }}
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Next Button (Desktop/Click) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-30 p-3 sm:p-4 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 backdrop-blur-md transition-all shadow-2xl cursor-pointer hover:scale-110 active:scale-95 group"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Floating Mobile Touch Hint Badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-medium text-slate-300 flex items-center gap-2 pointer-events-none opacity-80 max-sm:flex hidden">
            <Move className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pinch or double-tap to zoom • Swipe to navigate</span>
          </div>
        </div>

        {/* BOTTOM THUMBNAILS CAROUSEL */}
        <AnimatePresence>
          {showThumbnails && images.length > 1 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar scroll-smooth">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => changeSlide(idx)}
                    className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === currentIndex
                        ? 'border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                        : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {idx === currentIndex && (
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
