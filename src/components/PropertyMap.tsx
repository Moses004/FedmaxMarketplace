import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Listing } from '../types';
import { MapPin, Info, Compass, ZoomIn, ZoomOut, Search, Home, Building, Bed } from 'lucide-react';

const getListingIcon = (type: 'room' | 'apartment' | 'studio', className = "w-3.5 h-3.5") => {
  switch (type) {
    case 'room':
      return <Bed className={className} />;
    case 'studio':
      return <Building className={className} />;
    case 'apartment':
    default:
      return <Home className={className} />;
  }
};

interface PropertyMapProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  center: { lat: number; lng: number };
  zoom: number;
}

const GOOGLE_MAPS_API_KEY =
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const isPlaceholderKey = (key: string): boolean => {
  if (!key) return true;
  const lower = key.toLowerCase();
  return (
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.includes('mock') ||
    lower.includes('test') ||
    lower.includes('your_api_key') ||
    lower.includes('yourkey') ||
    lower.includes('my_google_maps') ||
    key.length < 35 // A real Google Maps API key is always 39 characters long
  );
};

// Static check: Real API keys start with AIzaSy. This filters out placeholders.
const hasValidKey =
  Boolean(GOOGLE_MAPS_API_KEY) &&
  GOOGLE_MAPS_API_KEY.startsWith('AIzaSy') &&
  !isPlaceholderKey(GOOGLE_MAPS_API_KEY);

// Custom minimal light silver map styles matching Fedmax premium branding
const SILVER_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f8fafc" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "simplified" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#475569" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f8fafc" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#cbd5e1" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#f1f5f9" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64748b" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e2e8f0" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64748b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#e2e8f0" }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{ "color": "#cbd5e1" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e0f2fe" }] // Soft ocean light blue
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#0369a1" }]
  }
];

// Global state to track dynamic Google Maps authentication failure
let globalGoogleMapsAuthFailed = false;
const authFailureListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn("Google Maps API Key is invalid or unauthorized. Falling back to the interactive mock map.");
    globalGoogleMapsAuthFailed = true;
    authFailureListeners.forEach((listener) => listener());
  };
}

interface PropertyMapInnerProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  center: { lat: number; lng: number };
  zoom: number;
}

function PropertyMapInner({
  listings,
  selectedListing,
  onSelectListing,
  center,
  zoom,
}: PropertyMapInnerProps) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});

  // Initialize and clean up MarkerClusterer
  useEffect(() => {
    if (!map) return;
    const mc = new MarkerClusterer({ map });
    clustererRef.current = mc;

    // Add any markers that mounted before clusterer was initialized
    const activeMarkers = Object.values(markersRef.current);
    if (activeMarkers.length > 0) {
      mc.addMarkers(activeMarkers as any[]);
    }

    return () => {
      mc.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Clean up markers that are no longer in the listings array
  useEffect(() => {
    if (!clustererRef.current) return;
    
    const listingIds = new Set(listings.map((l) => l.id));
    const currentCachedKeys = Object.keys(markersRef.current);

    currentCachedKeys.forEach((id) => {
      if (!listingIds.has(id)) {
        const marker = markersRef.current[id];
        if (marker) {
          clustererRef.current?.removeMarker(marker);
          delete markersRef.current[id];
        }
      }
    });
  }, [listings]);

  // Callback ref to register and unregister individual markers with MarkerClusterer
  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    if (marker) {
      const isNew = !markersRef.current[id];
      markersRef.current[id] = marker;
      if (isNew && clustererRef.current) {
        clustererRef.current.addMarker(marker);
      }
    } else {
      const existing = markersRef.current[id];
      if (existing) {
        if (clustererRef.current) {
          clustererRef.current.removeMarker(existing);
        }
        delete markersRef.current[id];
      }
    }
  }, []);

  return (
    <Map
      id="fedmax_listings_map"
      defaultCenter={center}
      defaultZoom={zoom}
      center={center}
      zoom={zoom}
      mapId="bf36f97f7481b4" // Optional: vector maps ID
      gestureHandling="greedy"
      disableDefaultUI={false}
      styles={SILVER_MAP_STYLE}
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      className="w-full h-full min-h-[400px]"
      style={{ width: '100%', height: '100%' }}
    >
      {listings.map((listing) => {
        const isSelected = selectedListing?.id === listing.id;
        return (
          <AdvancedMarker
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            onClick={() => onSelectListing(listing)}
            ref={(el) => setMarkerRef(el, listing.id)}
          >
            <div
              style={{ width: '82px', height: '36px' }}
              className={`relative group rounded-full font-bold text-xs shadow-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 text-white scale-110 border-indigo-500 ring-4 ring-indigo-500/20 z-50 shadow-indigo-500/30'
                  : 'bg-white text-slate-800 hover:bg-indigo-50 hover:border-indigo-300 border-slate-200 z-10'
              }`}
            >
              <div className={`p-1 rounded-full ${isSelected ? 'bg-indigo-500 text-amber-300' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-colors duration-200`}>
                {getListingIcon(listing.type, "w-3 h-3")}
              </div>
              <span className="font-extrabold text-[11px]">€{listing.price}</span>
              
              {/* A small arrow tail indicating map pin */}
              <div className={`absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b ${
                isSelected ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-300'
              }`} />
            </div>
          </AdvancedMarker>
        );
      })}
    </Map>
  );
}

export default function PropertyMap({
  listings,
  selectedListing,
  onSelectListing,
  center,
  zoom,
}: PropertyMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [authFailed, setAuthFailed] = useState(globalGoogleMapsAuthFailed);

  React.useEffect(() => {
    const handleAuthFailure = () => {
      setAuthFailed(true);
    };
    authFailureListeners.add(handleAuthFailure);
    return () => {
      authFailureListeners.delete(handleAuthFailure);
    };
  }, []);

  // Mock Map State for when Google Maps Key is not available
  const [mockZoom, setMockZoom] = useState(13);
  const [mockPan, setMockPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle Mock Map Dragging/Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mockPan.x, y: e.clientY - mockPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setMockPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const canShowMap = hasValidKey && !authFailed;

  if (canShowMap) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-50">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
          <PropertyMapInner
            listings={listings}
            selectedListing={selectedListing}
            onSelectListing={onSelectListing}
            center={center}
            zoom={zoom}
          />
        </APIProvider>
      </div>
    );
  }

  // --- SPLASH & INTERACTIVE MOCK MAP FALLBACK ---
  // If no Google Maps API key is provided, we render a beautiful, highly interactive schematic map simulation
  // with panning, zooming, and listing pins. This keeps the UX 100% functional and extremely professional.

  // Center coordinate of Madrid is approx. (40.4167, -3.7037).
  // We calculate relative SVG coordinates for our Madrid/Barcelona pins based on their lat/lng.
  const getRelativePosition = (lat: number, lng: number) => {
    // Madrid center references
    const refLat = center.lat;
    const refLng = center.lng;

    // Scale factors to turn lat/lng deltas into pixel offsets
    const scaleY = -3500 * (mockZoom / 13);
    const scaleX = 2800 * (mockZoom / 13);

    const deltaLat = lat - refLat;
    const deltaLng = lng - refLng;

    // Center in the container (width=600, height=500)
    const centerX = 300 + mockPan.x;
    const centerY = 250 + mockPan.y;

    return {
      x: centerX + deltaLng * scaleX,
      y: centerY + deltaLat * scaleY,
    };
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-100 flex flex-col bg-slate-900 select-none">
      {/* Map Content Simulator */}
      <div
        className={`relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing ${
          isDragging ? 'active:cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Grid Pattern simulating streets */}
        <div
          className="absolute inset-0 bg-slate-950 transition-all duration-75"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0),
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * (mockZoom / 13)}px ${40 * (mockZoom / 13)}px, ${80 * (mockZoom / 13)}px ${80 * (mockZoom / 13)}px`,
            backgroundPosition: `${mockPan.x}px ${mockPan.y}px`,
          }}
        />

        {/* Fake Parks / Water Bodies */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-20">
          {/* Simulated Retiro Park */}
          <rect
            x={getRelativePosition(40.415, -3.685).x}
            y={getRelativePosition(40.422, -3.685).y}
            width={120 * (mockZoom / 13)}
            height={160 * (mockZoom / 13)}
            rx={8}
            fill="#10b981"
            className="transition-all duration-75"
          />
          {/* Simulated Manzanares River */}
          <path
            d={`M ${getRelativePosition(40.43, -3.73).x} ${getRelativePosition(40.43, -3.73).y} 
                Q ${getRelativePosition(40.41, -3.72).x} ${getRelativePosition(40.41, -3.72).y} 
                  ${getRelativePosition(40.39, -3.69).x} ${getRelativePosition(40.39, -3.69).y}`}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth={15 * (mockZoom / 13)}
            className="transition-all duration-75"
          />
        </svg>

        {/* Map UI Indicators */}
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-300 pointer-events-none flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
          <span>Interactive Map (Simulated Mode)</span>
        </div>

        {/* Interactive Pins on the Mock Map */}
        {listings.map((listing) => {
          const pos = getRelativePosition(listing.lat, listing.lng);
          const isSelected = selectedListing?.id === listing.id;
          const isHovered = hoveredId === listing.id;

          // Don't render pins if they fly way out of the screen bounds
          if (pos.x < -100 || pos.x > 800 || pos.y < -100 || pos.y > 700) return null;

          return (
            <div
              key={listing.id}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHoveredId(listing.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectListing(listing);
              }}
              className="z-20 transition-all duration-200 cursor-pointer"
            >
              {/* Pulsing Highlight Circle */}
              {isSelected && (
                <div className="absolute -inset-4 bg-indigo-500/30 rounded-full animate-ping pointer-events-none" />
              )}

              {/* Custom Pin with Icon & Price */}
              <div
                className={`relative group px-2.5 py-1.5 rounded-full font-bold text-xs shadow-2xl transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 scale-110 z-40'
                    : isHovered
                    ? 'bg-indigo-500 text-white border-indigo-400 z-30'
                    : 'bg-slate-800 text-slate-100 border-slate-700/60 z-20'
                }`}
              >
                <div className={`p-0.5 rounded-full ${isSelected ? 'bg-indigo-500 text-amber-300' : isHovered ? 'bg-indigo-600 text-indigo-100' : 'bg-slate-700 text-slate-300'}`}>
                  {getListingIcon(listing.type, "w-3 h-3")}
                </div>
                <span className="font-extrabold text-[11px]">€{listing.price}</span>

                {/* Pin Tail */}
                <div className={`absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b ${
                  isSelected ? 'bg-indigo-600 border-indigo-400' : isHovered ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-800 border-slate-700/60'
                }`} />
              </div>
            </div>
          );
        })}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
          <button
            onClick={() => setMockZoom((z) => Math.min(16, z + 1))}
            className="p-2 bg-slate-900/95 border border-slate-700/50 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg active:scale-95 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMockZoom((z) => Math.max(10, z - 1))}
            className="p-2 bg-slate-900/95 border border-slate-700/50 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg active:scale-95 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setMockPan({ x: 0, y: 0 });
              setMockZoom(13);
            }}
            className="p-2 bg-slate-900/95 border border-slate-700/50 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg active:scale-95 transition-all"
            title="Reset Map View"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Setup Instructions Drawer / Overlay */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 text-slate-300">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              Connect Real Google Maps Platform API Key
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We have fully integrated the live maps layout! To enable rendering with live street maps, satellite imagery, and routing, simply configure your key:
            </p>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
              <div>1. Open <strong className="text-emerald-400">Settings</strong> (⚙️ gear icon, top-right)</div>
              <div>2. Select <strong className="text-emerald-400">Secrets</strong></div>
              <div>3. Add <code className="bg-slate-800 px-1 py-0.5 rounded text-yellow-400">GOOGLE_MAPS_PLATFORM_KEY</code></div>
              <div>4. Paste your API key, press <strong className="text-white">Enter</strong>, and watch it reload!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
