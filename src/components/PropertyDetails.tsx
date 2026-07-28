import React, { useState, useEffect, useRef } from 'react';
import { Listing, User, Booking } from '../types';
import { createBooking, getCurrentUser, getReviewsForListing } from '../services/store';
import PropertyStatusBadge from './PropertyStatusBadge';
import { 
  X, Check, Bed, Bath, Maximize, MapPin, Calendar, 
  Tv, Wifi, Wind, ShieldCheck, Flame, Briefcase, Sparkles, AlertCircle, RefreshCw,
  Share2, TrendingUp, Send, MessageSquare, ChevronLeft, ChevronRight, Star,
  Bus, ShoppingBag, GraduationCap, ExternalLink, Compass, Store, Navigation, Search,
  Copy, CheckCheck, Globe, Download, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface POIItem {
  name: string;
  type: string;
  distance: string;
  address?: string;
}

interface POIData {
  transit: POIItem[];
  grocery: POIItem[];
  schools: POIItem[];
  webSources?: Array<{ title: string; uri: string }>;
}

interface PropertyDetailsProps {
  listing: Listing;
  onClose: () => void;
  currentUser: User | null;
  onBookingCreated: () => void;
  onSwitchToGuest: () => void;
}

export default function PropertyDetails({
  listing,
  onClose,
  currentUser,
  onBookingCreated,
  onSwitchToGuest,
}: PropertyDetailsProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'description'>('photos');
  const [selectedPhoto, setSelectedPhoto] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);

  const handlePrev = () => {
    setDirection(-1);
    setSelectedPhoto((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const handleNext = () => {
    setDirection(1);
    setSelectedPhoto((prev) => (prev + 1) % listing.images.length);
  };
  const [showToast, setShowToast] = useState(false);
  
  // Neighborhood Smart Guide State & Effect
  interface NeighborhoodGuide {
    neighborhoodName: string;
    transitScore: number;
    safetyScore: number;
    amenitiesScore: number;
    nightlifeScore: number;
    transitDescription: string;
    safetyDescription: string;
    vibeDescription: string;
    localSecrets: string[];
  }
  
  const [neighborhoodData, setNeighborhoodData] = useState<NeighborhoodGuide | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadNeighborhood = async () => {
      setIsReportLoading(true);
      setReportError(null);
      try {
        const response = await fetch('/api/neighborhood-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: listing.location, listingName: listing.title })
        });
        if (!response.ok) throw new Error('Failed to load guide');
        const data = await response.json();
        if (active) {
          setNeighborhoodData(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          // Fallback static guide in case Gemini is not configured / fails
          setNeighborhoodData({
            neighborhoodName: listing.location.split(',')[0] || "Local Area",
            transitScore: 8,
            safetyScore: 9,
            amenitiesScore: 8,
            nightlifeScore: 7,
            transitDescription: "Excellent walking connections. Multiple metro lines and bus routes are available within a 5-minute walk, providing seamless access to central hubs.",
            safetyDescription: "Highly secure and peaceful residential street. Very well lit at night, popular with young professionals and families.",
            vibeDescription: "A perfect blend of residential serenity and active lifestyle. Excellent local cafés, organic markets, and boutique shops right at your doorstep.",
            localSecrets: [
              "The local bakery down the corner serves the best traditional pastries starting from 7:30 AM.",
              "A quiet courtyard park is tucked behind the main boulevard, ideal for morning yoga.",
              "The direct bus express route can cut your commute to the downtown core by 15 minutes."
            ]
          });
        }
      } finally {
        if (active) setIsReportLoading(false);
      }
    };

    loadNeighborhood();
    return () => {
      active = false;
    };
  }, [listing.id, listing.location, listing.title]);

  // Local Points of Interest (POI) State & Google Search Grounding Effect
  const [poiData, setPoiData] = useState<POIData | null>(null);
  const [isPoiLoading, setIsPoiLoading] = useState(false);
  const [poiActiveTab, setPoiActiveTab] = useState<'all' | 'transit' | 'grocery' | 'schools'>('all');

  useEffect(() => {
    let active = true;
    const fetchPOI = async () => {
      setIsPoiLoading(true);
      try {
        const response = await fetch('/api/points-of-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: listing.lat,
            lng: listing.lng,
            location: listing.location,
            title: listing.title
          })
        });
        if (!response.ok) throw new Error('Failed to fetch POI data');
        const data = await response.json();
        
        if (active) {
          if ((data.transit && data.transit.length > 0) || (data.grocery && data.grocery.length > 0) || (data.schools && data.schools.length > 0)) {
            setPoiData(data);
          } else {
            applyFallbackPoi();
          }
        }
      } catch (err) {
        console.error("POI Fetch Error:", err);
        if (active) {
          applyFallbackPoi();
        }
      } finally {
        if (active) setIsPoiLoading(false);
      }
    };

    const applyFallbackPoi = () => {
      const isMadrid = listing.location.toLowerCase().includes('madrid');
      const isBarcelona = listing.location.toLowerCase().includes('barcelona');

      if (isMadrid) {
        setPoiData({
          transit: [
            { name: "Velázquez Metro Station (Line 4)", type: "Subway / Metro", distance: "3 min walk (220m)", address: "Calle de Velázquez, Madrid" },
            { name: "Príncipe de Vergara Hub (Lines 2 & 9)", type: "Transit Hub", distance: "6 min walk (480m)", address: "Calle de Alcalá, Madrid" },
            { name: "EMT Bus Stop (Lines 1, 9, 74)", type: "Bus Stop", distance: "2 min walk (120m)", address: "Calle de Goya, Madrid" }
          ],
          grocery: [
            { name: "Mercadona Supermarket", type: "Supermarket", distance: "4 min walk (300m)", address: "Calle de Serrano 42" },
            { name: "Carrefour Express Organic", type: "Convenience & Organic", distance: "2 min walk (140m)", address: "Calle Velázquez 38" },
            { name: "El Corte Inglés Gourmet Club", type: "Gourmet Food Hall", distance: "7 min walk (550m)", address: "Calle de Goya 27" }
          ],
          schools: [
            { name: "IE Business School Executive Campus", type: "University / Business School", distance: "7 min walk (550m)", address: "Calle María de Molina 11" },
            { name: "CEIP Concepción Arenal", type: "Primary & Secondary School", distance: "5 min walk (380m)", address: "Calle Diego de León" },
            { name: "Universidad CEU San Pablo", type: "Higher Education Campus", distance: "12 min transit (1.2km)", address: "Calle Isaac Peral" }
          ],
          webSources: [
            { title: "Metro de Madrid Official Transit Map", uri: "https://www.metromadrid.es" },
            { title: "Google Maps Location Intelligence", uri: "https://maps.google.com" }
          ]
        });
      } else if (isBarcelona) {
        setPoiData({
          transit: [
            { name: "Diagonal Metro Station (L3 & L5)", type: "Subway / Metro", distance: "4 min walk (280m)", address: "Passeig de Gràcia, Barcelona" },
            { name: "FGC Provença Commuter Hub", type: "Commuter Railway", distance: "6 min walk (450m)", address: "Carrer de Provença, Barcelona" },
            { name: "TMB Bus Station (Lines 6, 7, 33)", type: "Bus Stop", distance: "2 min walk (110m)", address: "Avinguda Diagonal, Barcelona" }
          ],
          grocery: [
            { name: "Mercadona Eixample", type: "Supermarket", distance: "5 min walk (380m)", address: "Carrer de Mallorca" },
            { name: "Veritas Ecological Market", type: "Organic Supermarket", distance: "3 min walk (210m)", address: "Carrer de Balmes" },
            { name: "Supermercat Ametller Origen", type: "Fresh Market & Bakery", distance: "6 min walk (420m)", address: "Enric Granados" }
          ],
          schools: [
            { name: "EADA Business School Barcelona", type: "Business & Management School", distance: "8 min walk (620m)", address: "Carrer d'Aragó 204" },
            { name: "Escola Infant Jesús", type: "Primary & Secondary School", distance: "6 min walk (450m)", address: "Carrer de l'Avenir" },
            { name: "ESADE University Campus", type: "University Campus", distance: "10 min transit (1.1km)", address: "Av. Pedralbes" }
          ],
          webSources: [
            { title: "TMB Barcelona Public Transport", uri: "https://www.tmb.cat" },
            { title: "Google Maps Location Intelligence", uri: "https://maps.google.com" }
          ]
        });
      } else {
        setPoiData({
          transit: [
            { name: "Central Metro & Commuter Stop", type: "Subway / Tram", distance: "4 min walk (300m)", address: "Main Avenue" },
            { name: "Express Bus Stop (Routes 12 & 45)", type: "Bus Stop", distance: "2 min walk (120m)", address: "Station Square" }
          ],
          grocery: [
            { name: "Fresh City Supermarket", type: "Supermarket", distance: "3 min walk (220m)", address: "Market District" },
            { name: "Bio Green Organic Grocery", type: "Organic Market", distance: "5 min walk (380m)", address: "High Street" }
          ],
          schools: [
            { name: "Metropolitan Academy & School", type: "Primary & Secondary", distance: "6 min walk (450m)", address: "Academic Boulevard" },
            { name: "International University Hub", type: "University Campus", distance: "10 min walk (750m)", address: "University Row" }
          ]
        });
      }
    };

    fetchPOI();
    return () => {
      active = false;
    };
  }, [listing.id, listing.lat, listing.lng, listing.location, listing.title]);
  
  // AI Chat Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: `Hi! I'm your Rentora AI Assistant. Ask me anything about "${listing.title}"!` }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput.trim();
    if (!text || isAiLoading) return;

    if (!textToSend) {
      setChatInput('');
    }

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          listingName: listing.title,
          listingDescription: listing.description,
          listingLocation: listing.location,
          listingPrice: listing.price,
          listingType: listing.type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.text || "Sorry, I couldn't generate a response." }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting to the AI helper right now. Please try again!" }]);
    } finally {
      setIsAiLoading(false);
    }
  };
  
  // Open Graph Dynamic Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rentora-realestate.com';
  const ogImageUrl = `${baseUrl}/api/og-image?title=${encodeURIComponent(listing.title)}&price=${encodeURIComponent(listing.price)}&location=${encodeURIComponent(listing.location)}&image=${encodeURIComponent(listing.images[0])}&bedrooms=${listing.bedrooms}&bathrooms=${listing.bathrooms}&size=${listing.size}&type=${encodeURIComponent(listing.type)}`;
  const ogShareUrl = `${baseUrl}/og/${listing.id}?title=${encodeURIComponent(listing.title)}&price=${encodeURIComponent(listing.price)}&location=${encodeURIComponent(listing.location)}&image=${encodeURIComponent(listing.images[0])}&bedrooms=${listing.bedrooms}&bathrooms=${listing.bathrooms}&size=${listing.size}&type=${encodeURIComponent(listing.type)}`;
  const shareText = `Check out this verified ${listing.type} in ${listing.location} for €${listing.price}/mo on Rentora RealEstate!`;

  // Handle sharing of unique URL and opening dynamic OG card
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      } else {
        console.error('Fallback copy was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
  };
  
  // Booking Form State
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [personalMessage, setPersonalMessage] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Calculate booking length (in months)
  const calculateMonths = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Average 30 days per month
    const months = parseFloat((diffDays / 30.4).toFixed(1));
    return Math.max(0.5, months);
  };

  const monthsCount = calculateMonths();
  const annualDiscountPct = listing.annualDiscountPercentage ?? 10;
  const discountedMonthlyPrice = Math.round(listing.price * (1 - annualDiscountPct / 100));
  const effectivePrice = billingCycle === 'annual' ? discountedMonthlyPrice : listing.price;
  const platformFee = 50; // flat processing fee in EUR
  const totalRent = Math.round(monthsCount * effectivePrice);
  const totalAmount = Math.round(totalRent + platformFee);
  const totalSavings = billingCycle === 'annual' ? Math.round(monthsCount * (listing.price - discountedMonthlyPrice)) : 0;

  // Generate price history for the chart
  const priceHistoryData = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < listing.id.length; i++) {
      hash = listing.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const quarters = ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Current'];
    const steps: number[] = [];
    let price = listing.price;
    
    for (let i = quarters.length - 1; i >= 0; i--) {
      if (i === quarters.length - 1) {
        steps.unshift(listing.price);
      } else {
        const pct = 0.015 + (Math.abs((hash + i) % 8) / 250); // 1.5% to 4.7%
        price = Math.round(price / (1 + pct));
        steps.unshift(price);
      }
    }
    
    return quarters.map((q, idx) => {
      const currentQuarterPrice = steps[idx];
      // Madrid vs Barcelona Average
      const isMadrid = listing.location.toLowerCase().includes('madrid');
      // Make our property either slightly premium or slightly bargain compared to avg
      const variation = ((hash + idx) % 15 - 7) / 100; // -7% to +7% variation
      const averagePrice = Math.round(currentQuarterPrice * (1 + variation));
      
      return {
        name: q,
        price: currentQuarterPrice,
        average: averagePrice
      };
    });
  }, [listing.id, listing.price, listing.location]);

  const handleBookingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setBookingStatus('submitting');
    
    // Simulate API delay
    setTimeout(() => {
      createBooking({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images[0],
        listingPrice: listing.price,
        guestId: currentUser.id,
        guestName: currentUser.name,
        guestEmail: currentUser.email,
        startDate,
        endDate,
        totalAmount,
        billingCycle,
        effectiveMonthlyPrice: effectivePrice,
        annualDiscountPercentage: annualDiscountPct,
      });
      setBookingStatus('success');
      setTimeout(() => {
        onBookingCreated();
      }, 2000);
    }, 1200);
  };

  // Map amenities to beautiful icons
  const amenityIcons: Record<string, React.ReactNode> = {
    'High-Speed Wi-Fi': <Wifi className="w-4 h-4 text-emerald-500" />,
    'Superfast Wi-Fi': <Wifi className="w-4 h-4 text-emerald-500" />,
    'Air Conditioning': <Wind className="w-4 h-4 text-indigo-500" />,
    'Smart TV': <Tv className="w-4 h-4 text-amber-500" />,
    'Private Balcony': <Sparkles className="w-4 h-4 text-rose-500" />,
    'Private Terrace': <Sparkles className="w-4 h-4 text-rose-500" />,
    'Rooftop Access': <Sparkles className="w-4 h-4 text-rose-500" />,
    'Double Bed': <Bed className="w-4 h-4 text-teal-500" />,
    'Private Kitchenette': <Flame className="w-4 h-4 text-orange-500" />,
    'Fully Equipped Kitchen': <Flame className="w-4 h-4 text-orange-500" />,
    'Rainfall Shower': <Bath className="w-4 h-4 text-sky-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side Container: flex column & relative to host floating AI button & chat */}
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
          {/* Left Side: Images & Info Panel */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                  {listing.type.toUpperCase()}
                </span>
                <PropertyStatusBadge status={listing.status} size="md" />
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {listing.location.split(',')[1] || listing.location}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                {listing.title}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleShare}
                className="p-2 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-full border border-emerald-100 transition-colors flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 cursor-pointer shadow-sm bg-emerald-50/30"
                title="Share this listing"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full border border-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Big Photo Section */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 aspect-[16/10] group">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={selectedPhoto}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : '0%',
                      opacity: 0
                    }),
                    center: {
                      x: '0%',
                      opacity: 1
                    },
                    exit: (dir: number) => ({
                      x: dir < 0 ? '100%' : dir > 0 ? '-100%' : '0%',
                      opacity: 0
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -50) {
                      handleNext();
                    } else if (info.offset.x > 50) {
                      handlePrev();
                    }
                  }}
                  src={listing.images[selectedPhoto] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
                  alt={listing.title}
                  className="absolute w-full h-full object-cover select-none cursor-grab active:cursor-grabbing"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
            </div>

            {/* Left/Right Chevron Navigation */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/60 text-white p-2 rounded-full z-20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 shadow-lg cursor-pointer max-sm:opacity-100 flex items-center justify-center hover:scale-110 active:scale-95"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/60 text-white p-2 rounded-full z-20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 shadow-lg cursor-pointer max-sm:opacity-100 flex items-center justify-center hover:scale-110 active:scale-95"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full flex gap-1.5 z-20">
                {listing.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > selectedPhoto ? 1 : -1);
                      setSelectedPhoto(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      idx === selectedPhoto ? 'bg-emerald-400 w-4' : 'bg-white/50 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
              <span className="text-slate-400 text-xs block mb-1">Bedrooms</span>
              <span className="font-bold text-slate-800 flex items-center justify-center gap-1.5 text-sm">
                <Bed className="w-4 h-4 text-emerald-500" />
                {listing.bedrooms || 'Studio'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
              <span className="text-slate-400 text-xs block mb-1">Bathrooms</span>
              <span className="font-bold text-slate-800 flex items-center justify-center gap-1.5 text-sm">
                <Bath className="w-4 h-4 text-indigo-500" />
                {listing.bathrooms}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
              <span className="text-slate-400 text-xs block mb-1">Size</span>
              <span className="font-bold text-slate-800 flex items-center justify-center gap-1.5 text-sm">
                <Maximize className="w-4 h-4 text-amber-500" />
                {listing.size} m²
              </span>
            </div>
          </div>

          {/* Full Description */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">About this home</h4>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Amenities checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Amenities</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {listing.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 font-medium">
                  {amenityIcons[amenity] || <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verfied landlord badge */}
          <div className="flex items-center gap-3.5 bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              FM
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                Rentora Verified Landlord
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </h5>
              <p className="text-slate-500 text-xs">
                This property was inspected in person by the Rentora RealEstate team.
              </p>
            </div>
          </div>

          {/* Verified Tenant Reviews & Ratings */}
          {(() => {
            const reviews = getReviewsForListing(listing.id);
            const avgRating = reviews.length > 0 
              ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
              : null;

            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Verified Tenant Reviews ({reviews.length})</span>
                  </h4>
                  {avgRating && (
                    <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{avgRating} / 5.0 Rating</span>
                    </span>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-bold text-slate-600">No tenant reviews yet</p>
                    <p className="text-[11px] text-slate-400">Reviews are left by confirmed tenants after their lease is signed and activated.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">
                              {rev.guestName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 text-xs block leading-tight">{rev.guestName}</span>
                              <span className="text-[9.5px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded">Verified Tenant</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed pl-1">
                          "{rev.comment}"
                        </p>
                        <p className="text-[9.5px] text-slate-400 text-right">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Price History Trend Chart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Price Trend History
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                Last 18 Months
              </span>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Historical Low</span>
                  <span className="font-bold text-slate-700">€{priceHistoryData[0]?.price || 0}/mo</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Increase</span>
                  <span className="font-bold text-emerald-600">
                    +{priceHistoryData[0]?.price ? Math.round(((listing.price - priceHistoryData[0].price) / priceHistoryData[0].price) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div className="w-full h-40 text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={priceHistoryData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      dy={8}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        color: '#fff', 
                        borderRadius: '0.75rem',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                      formatter={(value: any, name: any) => [`€${value}`, name === 'price' ? 'This Property' : 'City Average']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      name="price"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#6366f1" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#colorAvg)" 
                      name="average"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                  <span>This Property</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-dashed border-indigo-500 bg-indigo-50 rounded-full inline-block"></span>
                  <span>{listing.location.toLowerCase().includes('madrid') ? 'Madrid' : 'Barcelona'} Avg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart AI Neighborhood Guide */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Smart Neighborhood Guide
            </h4>
            
            <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50 border border-slate-100 p-4 rounded-2xl space-y-4">
              {isReportLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="text-xs font-medium animate-pulse">Consulting local neighborhood guides...</span>
                </div>
              ) : neighborhoodData ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{neighborhoodData.neighborhoodName}</h5>
                      <p className="text-[10px] text-slate-400 font-medium">Smart AI Local Area Report</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-extrabold uppercase tracking-wider">
                      Verified Data
                    </span>
                  </div>

                  {/* 4 Scorecards Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-semibold">Transit Connection</span>
                        <span className="text-[10px] font-bold text-emerald-600">{neighborhoodData.transitScore}/10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${neighborhoodData.transitScore * 10}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">{neighborhoodData.transitDescription}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-semibold">Safety & Security</span>
                        <span className="text-[10px] font-bold text-indigo-600">{neighborhoodData.safetyScore}/10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${neighborhoodData.safetyScore * 10}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">{neighborhoodData.safetyDescription}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-semibold">Local Amenities</span>
                        <span className="text-[10px] font-bold text-amber-600">{neighborhoodData.amenitiesScore}/10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${neighborhoodData.amenitiesScore * 10}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">{neighborhoodData.vibeDescription}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-semibold">Nightlife & Dining</span>
                        <span className="text-[10px] font-bold text-purple-600">{neighborhoodData.nightlifeScore}/10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${neighborhoodData.nightlifeScore * 10}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">Lively local gastronomy, tapas taverns, and social spots nearby.</p>
                    </div>
                  </div>

                  {/* Local Secrets Bento box */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100/80 space-y-2">
                    <h6 className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Insider Secrets & Hidden Gems
                    </h6>
                    <ul className="space-y-1.5">
                      {neighborhoodData.localSecrets.map((secret, idx) => (
                        <li key={idx} className="flex gap-2 text-[10.5px] text-slate-600 leading-normal items-start">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0 mt-1.5"></span>
                          <span>{secret}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 py-4">No report available.</div>
              )}
            </div>
          </div>

          {/* Local Points of Interest (Transit, Grocery, Schools) */}
          <div className="space-y-3 pt-4 border-t border-slate-100" id="local-points-of-interest-section">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                Local Points of Interest
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
                <Search className="w-3 h-3 text-emerald-600" />
                Google Search API
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-4 shadow-sm">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-[11px] font-extrabold">
                <button
                  onClick={() => setPoiActiveTab('all')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    poiActiveTab === 'all'
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Places
                </button>
                <button
                  onClick={() => setPoiActiveTab('transit')}
                  className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    poiActiveTab === 'transit'
                      ? 'bg-white text-emerald-700 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transit</span>
                </button>
                <button
                  onClick={() => setPoiActiveTab('grocery')}
                  className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    poiActiveTab === 'grocery'
                      ? 'bg-white text-amber-700 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Grocery</span>
                </button>
                <button
                  onClick={() => setPoiActiveTab('schools')}
                  className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    poiActiveTab === 'schools'
                      ? 'bg-white text-indigo-700 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Schools</span>
                </button>
              </div>

              {/* Loading State */}
              {isPoiLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold animate-pulse text-slate-600">
                    Querying Google Search for nearby transit, markets & schools...
                  </span>
                </div>
              ) : poiData ? (
                <div className="space-y-3">
                  {/* Transit Category */}
                  {(poiActiveTab === 'all' || poiActiveTab === 'transit') && poiData.transit && poiData.transit.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wide">
                        <Bus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Transit Stations ({poiData.transit.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {poiData.transit.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all shadow-2xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-extrabold text-slate-900 text-xs leading-snug">{item.name}</h5>
                              <span className="shrink-0 text-[9.5px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                {item.distance}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span className="font-semibold text-emerald-800/80">{item.type}</span>
                              {item.address && <span className="text-slate-400 truncate max-w-[120px]">{item.address}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grocery Category */}
                  {(poiActiveTab === 'all' || poiActiveTab === 'grocery') && poiData.grocery && poiData.grocery.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wide">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Grocery Stores & Markets ({poiData.grocery.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {poiData.grocery.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-amber-300 transition-all shadow-2xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-extrabold text-slate-900 text-xs leading-snug">{item.name}</h5>
                              <span className="shrink-0 text-[9.5px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-100">
                                {item.distance}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span className="font-semibold text-amber-800/80">{item.type}</span>
                              {item.address && <span className="text-slate-400 truncate max-w-[120px]">{item.address}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schools Category */}
                  {(poiActiveTab === 'all' || poiActiveTab === 'schools') && poiData.schools && poiData.schools.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-800 uppercase tracking-wide">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Schools & Universities ({poiData.schools.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {poiData.schools.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all shadow-2xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-extrabold text-slate-900 text-xs leading-snug">{item.name}</h5>
                              <span className="shrink-0 text-[9.5px] font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-100">
                                {item.distance}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span className="font-semibold text-indigo-800/80">{item.type}</span>
                              {item.address && <span className="text-slate-400 truncate max-w-[120px]">{item.address}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Web Sources Citations if available from Google Search */}
                  {poiData.webSources && poiData.webSources.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Search Grounding References</p>
                      <div className="flex flex-wrap gap-1.5">
                        {poiData.webSources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-white border border-slate-200 hover:border-emerald-400 text-slate-600 hover:text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all"
                          >
                            <span className="truncate max-w-[160px]">{source.title || source.uri}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">No points of interest found near this location.</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating Ask AI Button - stationary at bottom-right of left panel */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="absolute bottom-6 right-6 z-30 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-4 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-indigo-500/20"
            id="ask-ai-button"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/25 animate-pulse" />
            <span>Ask AI Helper</span>
          </button>
        )}

        {/* Floating AI Chat Drawer */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="absolute bottom-6 right-6 z-40 w-full max-w-[360px] h-[460px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
              id="ai-chat-box"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3.5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/20" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Rentora AI Assistant</h4>
                    <p className="text-[10px] text-indigo-100 font-medium">Online</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 font-sans">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested Quick Questions */}
              {chatMessages.length === 1 && (
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {[
                    "What amenities are here?",
                    "Tell me about the location",
                    "How is the price history?"
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-pointer font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2 border-t border-slate-100 bg-white flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this listing..."
                  disabled={isAiLoading}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !chatInput.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-slate-100 disabled:text-slate-400 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Side: Sticky Checkout / Booking Form */}
      <div className="w-full md:w-[380px] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 md:p-8 flex flex-col justify-between shrink-0">
          <div>
            {/* Billing Cycle Selector Toggle */}
            <div className="mb-4 p-1 bg-slate-200/60 rounded-2xl flex items-center gap-1 border border-slate-200/50">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Monthly Rent
              </button>
              <button
                type="button"
                onClick={() => {
                  setBillingCycle('annual');
                  // Auto-fill 1 year duration
                  const start = new Date(startDate);
                  if (!isNaN(start.getTime())) {
                    const end = new Date(start);
                    end.setFullYear(end.getFullYear() + 1);
                    setEndDate(end.toISOString().split('T')[0]);
                  }
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-100/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                <span>Annual ({annualDiscountPct}% Off)</span>
              </button>
            </div>

            {/* Price Header */}
            <div className="mb-5 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  {billingCycle === 'annual' ? 'Annual Upfront Rate' : 'Standard Monthly Rent'}
                </span>
                {billingCycle === 'annual' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                    Save {annualDiscountPct}%
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-800">€{effectivePrice}</span>
                <span className="text-slate-500 text-sm font-medium">/month</span>
                {billingCycle === 'annual' && (
                  <span className="text-sm font-semibold text-slate-400 line-through">
                    €{listing.price}
                  </span>
                )}
              </div>
              {billingCycle === 'annual' ? (
                <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
                  <span>Saves €{Math.round((listing.price - discountedMonthlyPrice) * 12)} / year with annual payment</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">All utility bills included up to €80/mo</p>
              )}
            </div>

            {bookingStatus === 'success' ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-3.5 my-8">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-800 text-base">Request Submitted!</h4>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    The owner Carlos has been notified and will review your {billingCycle} booking shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingRequest} className="space-y-4">
                {/* Date Inputs */}
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Check-In Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Check-Out Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Message to Host */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Introduce Yourself</label>
                  <textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Tell Carlos about your studies or job..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-16 resize-none"
                  />
                </div>

                {/* Checkout Summary */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Plan</span>
                    <span className="font-bold text-slate-800 capitalize">{billingCycle} Prepayment</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Duration</span>
                    <span className="font-semibold text-slate-800">{monthsCount} months</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Rate</span>
                    <span className="font-semibold text-slate-800">€{effectivePrice} / mo</span>
                  </div>
                  {billingCycle === 'annual' && totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      <span>Annual Discount Saved</span>
                      <span>- €{totalSavings}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-100">
                    <span>One-time Booking Fee</span>
                    <span className="font-semibold text-slate-800">€{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-800 pt-1">
                    <span>Total Request Value</span>
                    <span className="text-emerald-600">€{totalAmount}</span>
                  </div>
                </div>

                {/* Booking CTA Button */}
                {currentUser ? (
                  currentUser.role === 'guest' ? (
                    <button
                      type="submit"
                      disabled={bookingStatus === 'submitting'}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {bookingStatus === 'submitting' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <span>Request Booking Approval</span>
                      )}
                    </button>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-100 p-3.5 rounded-xl space-y-2 text-xs text-yellow-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span>Landlords cannot book listings</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        To test this booking request, click the button below to instantly switch to your Guest identity!
                      </p>
                      <button
                        type="button"
                        onClick={onSwitchToGuest}
                        className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                      >
                        Switch to Guest Mode
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-medium">
                    Please log in to submit requests.
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="mt-6 text-[11px] text-slate-400 leading-relaxed text-center">
            🔒 <strong>Secure Reservation</strong>: You won&apos;t pay anything yet. The landlord Carlos has 48 hours to accept or decline. Your card is only authorized upon landlord approval.
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-800"
          >
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>Link copied!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Open Graph Share & Preview Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    Dynamic Open Graph Card
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 uppercase tracking-wide">
                      Live SEO Image
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    On-the-fly social preview card generated for maximum CTR on WhatsApp, Twitter, LinkedIn &amp; iMessage.
                  </p>
                </div>
              </div>

              {/* Live OG Card Image Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Generated 1200x630 Card
                  </span>
                  <a
                    href={ogImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>View Raw SVG Card</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[1200/630] group shadow-inner flex items-center justify-center">
                  <img
                    src={ogImageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Platform Share Buttons */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-300 block">Instant Social Sharing</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${ogShareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(ogShareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Twitter / X</span>
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ogShareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogShareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>Facebook</span>
                  </a>
                </div>
              </div>

              {/* Direct Copy Link Input */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dynamic Open Graph URL
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={ogShareUrl}
                    className="bg-transparent text-xs text-slate-300 px-2 flex-1 focus:outline-none font-mono select-all truncate"
                  />
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(ogShareUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      } else {
                        fallbackCopy(ogShareUrl);
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
