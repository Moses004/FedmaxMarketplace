import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Listing, User, Booking, PropertyType, PROPERTY_CATEGORY_OPTIONS } from './types';
import { 
  getProperties, 
  getBookings, 
  getFavorites, 
  toggleFavorite,
  incrementListingViews,
  getListingViews,
  subscribeToSupabaseChanges, 
  subscribeToStorageObjects 
} from './services/databaseService';
import { getCurrentSupabaseUser, loginWithSupabase, logoutWithSupabase } from './services/authService';
import PropertyMap from './components/PropertyMap';
import HotPropertiesShowcase from './components/HotPropertiesShowcase';
import PropertyCard, { PropertyCardSkeleton } from './components/PropertyCard';
import { BookingsViewSkeleton } from './components/BookingsView';
import { LandlordDashboardSkeleton } from './components/LandlordDashboard';
import AuthModal from './components/AuthModal';
import PlacesAutocompleteSearch from './components/PlacesAutocompleteSearch';
import PromotionalBanner from './components/PromotionalBanner';
import Footer from './components/Footer';
import CompareBar from './components/CompareBar';
import MobileBottomNav from './components/MobileBottomNav';
import { useToast } from './context/ToastContext';

// Sub-components
import PropertyDetails from './components/PropertyDetails';
import BookingsView from './components/BookingsView';
import LandlordDashboard from './components/LandlordDashboard';
import AddListingModal from './components/AddListingModal';
import ComparePropertiesModal from './components/ComparePropertiesModal';
import EditProfileModal from './components/EditProfileModal';
import EmailLogModal from './components/EmailLogModal';
import CurrencyConverterModal from './components/CurrencyConverterModal';
import RentAffordabilityCalculatorModal from './components/RentAffordabilityCalculatorModal';
import SavedSearchAlertModal from './components/SavedSearchAlertModal';
import LocationOnboardingModal from './components/LocationOnboardingModal';
import PullToRefresh from './components/PullToRefresh';
import VirtualizedPropertyList from './components/VirtualizedPropertyList';
import NotificationBell from './components/NotificationBell';
import { SEOMetadataManager } from './components/SEOMetadataManager';
import { 
  Building, Search, MapPin, Euro, Compass, Calendar, Mail, Map as MapIcon, Grid as GridIcon, Maximize2, Eye, EyeOff,
  User as UserIcon, Plus, Filter, RefreshCw, Sparkles, SlidersHorizontal, ChevronRight, ChevronLeft, LogOut, Check,
  BarChart3, Navigation, Globe, LocateFixed, UserPlus, ShieldCheck, Sun, Moon, ArrowLeftRight, Heart, Calculator, Bell,
  Flame, Layers, Zap
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { LAUNCH_REGIONS, GLOBAL_COUNTRIES, CountryData, getDistanceKm, getCurrentUserCoordinates, getCoordinatesForUserLocation, getStatesForCountry, getCitiesForState, getAreasForCity, resolveLocationMeta, matchesLocationSearch } from './utils/location';
import { SUPPORTED_CURRENCIES, resolveUserDefaultCurrency, detectIPCurrency } from './utils/currency';
import emptySearchImg from './assets/images/empty_search_results_1785810450193.jpg';
import emptySavedImg from './assets/images/empty_saved_properties_1785810460564.jpg';

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

function ExploreTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and filters bar skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-12 rounded-2xl animate-shimmer" />
          <div className="w-28 h-12 rounded-2xl shrink-0 animate-shimmer" />
          <div className="w-24 h-12 rounded-2xl shrink-0 animate-shimmer" />
        </div>
        <div className="h-10 rounded-xl w-full animate-shimmer" />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-8 w-28 rounded-xl shrink-0 animate-shimmer" />
          ))}
        </div>
      </div>

      {/* Grid + Map Dual Pane Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <PropertyCardSkeleton key={idx} />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-5 h-[500px] rounded-3xl border border-slate-200/50 dark:border-slate-800 animate-shimmer" />
      </div>
    </div>
  );
}

function FavoritesTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-xl animate-shimmer" />
          <div className="h-4 w-64 rounded-lg animate-shimmer" />
        </div>
        <div className="h-9 w-28 rounded-xl animate-shimmer" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <PropertyCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  // Core App Views
  const [currentTab, setCurrentTab] = useState<'explore' | 'bookings' | 'dashboard' | 'favorites'>('explore');
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);

  const handleTabChange = (newTab: 'explore' | 'bookings' | 'dashboard' | 'favorites') => {
    if (newTab === currentTab && !isTabLoading) return;
    setIsTabLoading(true);
    setCurrentTab(newTab);
    setSelectedListing(null);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 300);
  };
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Property Comparison State
  const [comparedListings, setComparedListings] = useState<Listing[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  const toggleCompareListing = (listing: Listing) => {
    setComparedListings((prev) => {
      const exists = prev.some((l) => l.id === listing.id);
      if (exists) {
        toast.info('Removed from Compare', listing.title);
        return prev.filter((l) => l.id !== listing.id);
      } else {
        if (prev.length >= 4) {
          toast.warning('Comparison Limit Reached', 'You can compare up to 4 properties at a time.');
          return prev;
        }
        toast.success('Added to Compare', `${listing.title} added (${prev.length + 1}/4)`);
        return [...prev, listing];
      }
    });
  };

  const removeCompareListing = (id: string) => {
    setComparedListings((prev) => {
      const target = prev.find((l) => l.id === id);
      if (target) {
        toast.info('Removed from Compare', target.title);
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  const clearCompareListings = () => {
    setComparedListings([]);
    toast.info('Compare List Cleared');
  };

  // Proactive Payment Due Toast Alert for Tenants
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'guest') return;
    let isCancelled = false;

    getBookings({ guestId: currentUser.id }).then((allBookings) => {
      if (isCancelled || !allBookings || allBookings.length === 0) return;
      const dueBooking = allBookings.find(
        (b) => (b.paymentStatus === 'due_soon' || (b.status === 'confirmed' && b.nextPaymentDueDate))
      );
      if (dueBooking) {
        const alertKey = `payment_due_alert_toast_${dueBooking.id}_${dueBooking.nextPaymentDueDate || '3days'}`;
        if (!sessionStorage.getItem(alertKey)) {
          const timer = setTimeout(() => {
            const daysLeft = dueBooking.paymentDueDaysLeft || 3;
            const isAnnual = dueBooking.billingCycle === 'annual';
            const dueDateStr = dueBooking.nextPaymentDueDate || 'Aug 8, 2026';
            toast.warning(
              `Payment Due Alert: Rent Due in ${daysLeft} Days`,
              `Your ${isAnnual ? 'annual' : 'monthly'} rent payment for "${dueBooking.listingTitle}" is due on ${dueDateStr}. Tap 'My Bookings' to complete payment.`
            );
            sessionStorage.setItem(alertKey, 'true');
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }).catch((err) => console.warn('Payment due alert check error:', err));

    return () => {
      isCancelled = true;
    };
  }, [currentUser]);

  // Online / Offline Network Status Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      toast.warning(
        'Offline Notice',
        'You appear to be offline. Your changes have not been saved.'
      );
    };

    const handleOnline = () => {
      toast.success(
        'Connection Restored',
        'You are back online! Syncing live exchange rates and properties.'
      );
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Dark Mode Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('rentora_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('rentora_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('rentora_theme', 'light');
    }
  }, [isDarkMode]);

  // Filter & Region States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');

  // Country / State / City Location Scoping States
  const [locationScopeMode, setLocationScopeMode] = useState<'my_location' | 'custom' | 'all'>('my_location');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('Nigeria');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');

  const [userGeoLocation, setUserGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [minBedrooms, setMinBedrooms] = useState<string>('all');
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);
  const [isVirtualizedScroll, setIsVirtualizedScroll] = useState<boolean>(false);

  // Initial load skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingListings(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Filter change skeleton shimmer effect to boost perceived performance
  useEffect(() => {
    setIsLoadingListings(true);
    const timer = setTimeout(() => {
      setIsLoadingListings(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedRegionId, selectedType, maxPrice, minBedrooms, locationScopeMode, selectedCountryFilter, selectedStateFilter, selectedCityFilter, selectedAreaFilter]);

  // Auto-sync location & coordinates when user logs in or registers
  useEffect(() => {
    if (currentUser) {
      if (currentUser.country) {
        setSelectedCountryFilter(currentUser.country);
      }
      if (currentUser.state) {
        setSelectedStateFilter(currentUser.state);
      } else {
        setSelectedStateFilter('all');
      }
      if (currentUser.city) {
        setSelectedCityFilter(currentUser.city);
      } else {
        setSelectedCityFilter('all');
      }
      if (currentUser.streetAddress) {
        setSelectedAreaFilter(currentUser.streetAddress);
      } else if (currentUser.preferredMoveInRegion) {
        const areaName = currentUser.preferredMoveInRegion.split(',')[0].trim();
        setSelectedAreaFilter(areaName);
      } else {
        setSelectedAreaFilter('all');
      }

      setLocationScopeMode('my_location');
      const coords = getCoordinatesForUserLocation(currentUser);
      setUserGeoLocation(coords);
      setMapCenter(coords);
      setMapZoom(13);
    }
  }, [currentUser]);

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authRole, setAuthRole] = useState<'guest' | 'landlord'>('guest');
  const [authName, setAuthName] = useState('');
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);

  // Full Sign Up / Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocationOnboarding, setShowLocationOnboarding] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);
  const [showAffordabilityCalculatorModal, setShowAffordabilityCalculatorModal] = useState(false);
  const [showSavedSearchAlertModal, setShowSavedSearchAlertModal] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'guest' | 'landlord'>('guest');
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login'>('signup');

  // Check if logged-in user needs location onboarding
  useEffect(() => {
    if (currentUser) {
      const hasFullLocation = Boolean(currentUser.country && currentUser.state && currentUser.city);
      const dismissed = sessionStorage.getItem(`rentora_dismissed_loc_onboard_${currentUser.id}`);
      if (!hasFullLocation && !dismissed) {
        setShowLocationOnboarding(true);
      }
    }
  }, [currentUser]);

  // Map Coordinates & Display Mode State
  const [mapCenter, setMapCenter] = useState({ lat: 40.4167, lng: -3.7037 }); // Madrid default
  const [mapZoom, setMapZoom] = useState(13);
  const [mapViewMode, setMapViewMode] = useState<'split' | 'grid' | 'map'>('split');
  const [recentViewMode, setRecentViewMode] = useState<'split' | 'grid' | 'map'>('split');

  const handleSetMapViewMode = (newMode: 'split' | 'grid' | 'map') => {
    setMapViewMode((prevMode) => {
      if (prevMode !== newMode) {
        setRecentViewMode(prevMode);
      }
      return newMode;
    });
  };

  const toggleMapCollapse = () => {
    if (mapViewMode === 'grid') {
      handleSetMapViewMode(recentViewMode && recentViewMode !== 'grid' ? recentViewMode : 'split');
    } else {
      handleSetMapViewMode('grid');
    }
  };

  // Refresh lists and auth states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false);

  const refreshData = async (overrideFilter?: { country?: string; region?: string; state?: string; city?: string }) => {
    setIsSyncingDatabase(true);
    try {
      const locFilter = overrideFilter || {
        country: selectedCountryFilter !== 'all' ? selectedCountryFilter : (currentUser?.country || 'Nigeria'),
        state: selectedStateFilter !== 'all' ? selectedStateFilter : (currentUser?.state || undefined),
        city: selectedCityFilter !== 'all' ? selectedCityFilter : (currentUser?.city || undefined),
      };

      const [props, bks] = await Promise.all([
        getProperties(locFilter).catch((err) => {
          console.error('Failed to fetch properties from Supabase:', err);
          return [];
        }),
        getBookings().catch((err) => {
          console.error('Failed to fetch bookings from Supabase:', err);
          return [];
        })
      ]);

      setListings(props || []);
      setBookings(bks || []);

      const sbUser = await getCurrentSupabaseUser();
      if (sbUser) {
        setCurrentUser(sbUser);
        const favs = await getFavorites(sbUser.id);
        setFavorites(favs || []);
      }
    } catch (err) {
      console.error('refreshData exception:', err);
    } finally {
      setIsSyncingDatabase(false);
    }
  };

  // Location-Based Display Currency State
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
  const [showCurrencyConverterModal, setShowCurrencyConverterModal] = useState<boolean>(false);
  const [currencySourceInfo, setCurrencySourceInfo] = useState<{ source: string; label: string }>({
    source: 'default',
    label: 'Detecting local currency...',
  });
  const [isDetectingCurrency, setIsDetectingCurrency] = useState<boolean>(true);

  // Auto-detect display currency based on User Profile settings, IP, or Timezone
  useEffect(() => {
    let isMounted = true;
    setIsDetectingCurrency(true);

    const resolved = resolveUserDefaultCurrency(currentUser);
    if (isMounted) {
      setDisplayCurrency(resolved.code);
      setCurrencySourceInfo({ source: resolved.source, label: resolved.label });
    }

    // Unless the user explicitly manually selected a currency override, run IP geolocation detection
    if (resolved.source !== 'override') {
      detectIPCurrency().then((ipResult) => {
        if (isMounted && ipResult?.code && SUPPORTED_CURRENCIES[ipResult.code]) {
          setDisplayCurrency(ipResult.code);
          setCurrencySourceInfo({
            source: 'ip',
            label: `IP Location: ${ipResult.country || 'Detected Region'} (${ipResult.code})`,
          });
        }
        if (isMounted) setIsDetectingCurrency(false);
      }).catch(() => {
        if (isMounted) setIsDetectingCurrency(false);
      });
    } else {
      setIsDetectingCurrency(false);
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleCurrencyChange = (newCode: string) => {
    if (!SUPPORTED_CURRENCIES[newCode]) return;
    setDisplayCurrency(newCode);
    localStorage.setItem('rentora_user_currency', newCode);
    setCurrencySourceInfo({
      source: 'override',
      label: `User Selected (${newCode})`,
    });
    const curr = SUPPORTED_CURRENCIES[newCode];
    toast.success(
      `Display Currency Set to ${curr.code}`,
      `Listings are now formatted in ${curr.name} (${curr.symbol}), with universal USD fallback.`
    );
  };

  useEffect(() => {
    refreshData();

    // Check for active Supabase session on mount
    getCurrentSupabaseUser().then((sbUser) => {
      if (sbUser) {
        setCurrentUser(sbUser);
      }
    }).catch(() => {});

    // Real-time Supabase Table & Storage Subscriptions across all application entities
    const unsubProperties = subscribeToSupabaseChanges('properties', refreshData);
    const unsubBookings = subscribeToSupabaseChanges('bookings', refreshData);
    const unsubMaint = subscribeToSupabaseChanges('maintenance_requests', refreshData);
    const unsubProfiles = subscribeToSupabaseChanges('profiles', refreshData);
    const unsubReviews = subscribeToSupabaseChanges('reviews', refreshData);
    const unsubFavorites = subscribeToSupabaseChanges('favorites', refreshData);
    const unsubStorage = subscribeToStorageObjects('property-images', refreshData);

    const handleStoreUpdate = () => {
      refreshData();
    };
    window.addEventListener('fedmax_store_change', handleStoreUpdate);
    window.addEventListener('storage', handleStoreUpdate);
    return () => {
      if (unsubProperties) unsubProperties();
      if (unsubBookings) unsubBookings();
      if (unsubMaint) unsubMaint();
      if (unsubProfiles) unsubProfiles();
      if (unsubReviews) unsubReviews();
      if (unsubFavorites) unsubFavorites();
      if (unsubStorage) unsubStorage();
      window.removeEventListener('fedmax_store_change', handleStoreUpdate);
      window.removeEventListener('storage', handleStoreUpdate);
    };
  }, []);

  // Sync location scope & map position whenever currentUser changes
  useEffect(() => {
    if (currentUser?.country) {
      setSelectedCountryFilter(currentUser.country);
      if (currentUser.city && currentUser.city !== 'all') {
        setSelectedCityFilter(currentUser.city);
      }
      if (currentUser.state && currentUser.state !== 'all') {
        setSelectedStateFilter(currentUser.state);
      }
      
      const coords = getCoordinatesForUserLocation(currentUser);
      if (coords) {
        setMapCenter({ lat: coords.lat, lng: coords.lng });
        setMapZoom(12);
      }
    }
  }, [currentUser]);

  // Parse deep-link query parameter or hash on load
  useEffect(() => {
    if (listings.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const listingId = params.get('listing');
      if (listingId) {
        const listing = listings.find(l => l.id === listingId);
        if (listing) {
          setSelectedListing(listing);
          setMapCenter({ lat: listing.lat, lng: listing.lng });
          setMapZoom(14);
        }
      } else {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#listing-')) {
          const id = hash.replace('#listing-', '');
          const listing = listings.find(l => l.id === id);
          if (listing) {
            setSelectedListing(listing);
            setMapCenter({ lat: listing.lat, lng: listing.lng });
            setMapZoom(14);
          }
        }
      }
    }
  }, [listings]);

  // Handler when region is selected
  const handleSelectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    if (regionId === 'all') {
      setMapCenter({ lat: 40.4167, lng: -3.7037 });
      setMapZoom(12);
      setMaxDistanceKm(null);
    } else {
      const region = LAUNCH_REGIONS.find((r) => r.id === regionId);
      if (region) {
        setMapCenter({ lat: region.center.lat, lng: region.center.lng });
        setMapZoom(region.zoom);
      }
    }
  };

  // Handler for GPS "Near Me"
  const handleGetUserLocation = async () => {
    setIsLocatingUser(true);
    try {
      const coords = await getCurrentUserCoordinates();
      setUserGeoLocation(coords);
      setMapCenter({ lat: coords.lat, lng: coords.lng });
      setMapZoom(13);
      setSelectedRegionId('near_me');
      setSelectedCountryFilter('all');
      setSelectedStateFilter('all');
      setSelectedCityFilter('all');
      setSelectedAreaFilter('all');
      if (!maxDistanceKm) setMaxDistanceKm(30);
      toast.success('Location Found', 'Showing properties near your GPS location.');
    } catch (err) {
      console.warn("User geolocation error, falling back to registered user location:", err);
      const fallbackCoords = getCoordinatesForUserLocation(currentUser);
      setUserGeoLocation(fallbackCoords);
      setMapCenter(fallbackCoords);
      setMapZoom(12);
      setSelectedRegionId('near_me');
      if (!maxDistanceKm) setMaxDistanceKm(50);
      toast.info(
        'Using Registered Location',
        `GPS permission unconfirmed. Showing properties near ${currentUser?.city || currentUser?.country || 'your registered location'}.`
      );
    } finally {
      setIsLocatingUser(false);
    }
  };

  // Quick Login Utility
  const handleQuickLogin = async (email: string, role: 'guest' | 'landlord', name: string) => {
    try {
      const user = await loginWithSupabase(email, undefined, role, name);
      setCurrentUser(user);
      setCurrentTab('explore');
      setShowAuthDropdown(false);
      refreshData();
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Login Failed', err.message || 'Could not authenticate with Supabase.');
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    try {
      const user = await loginWithSupabase(authEmail, undefined, authRole, authName || undefined);
      setCurrentUser(user);
      setCurrentTab('explore');
      setAuthEmail('');
      setAuthName('');
      setShowAuthDropdown(false);
      refreshData();
    } catch (err: any) {
      console.error('Custom login error:', err);
      toast.error('Login Failed', err.message || 'Could not authenticate with Supabase.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutWithSupabase();
    } catch (err) {
      console.warn('Supabase logout:', err);
    }
    setCurrentUser(null);
    setCurrentTab('explore');
    setAuthModalMode('login');
    setShowAuthModal(true);
    toast.info('Signed Out', 'Please sign in or sign up to access your account.');
    refreshData();
  };

  const handleToggleFavorite = async (listingId: string) => {
    if (!currentUser) {
      setAuthModalRole('guest');
      setAuthModalMode('login');
      setShowAuthModal(true);
      toast.info('Sign In Required', 'Please sign in to save your favorite properties.');
      return;
    }

    try {
      const isFav = await toggleFavorite(listingId, currentUser.id);
      setFavorites((prev) => isFav ? [...prev, listingId] : prev.filter((id) => id !== listingId));
    } catch (err: any) {
      console.error('Favorite error:', err);
      toast.error('Favorite Error', err.message || 'Failed to update favorite in database.');
    }
  };

  // Filter & Distance calculations
  const currentRegionObj = useMemo(
    () => LAUNCH_REGIONS.find((r) => r.id === selectedRegionId),
    [selectedRegionId]
  );

  const listingsWithDistance = useMemo(() => {
    return listings.map((listing) => {
      let distanceKm: number | null = null;
      const effectiveLocation = userGeoLocation || (currentUser ? getCoordinatesForUserLocation(currentUser) : null);
      if (effectiveLocation) {
        distanceKm = getDistanceKm(effectiveLocation.lat, effectiveLocation.lng, listing.lat, listing.lng);
      } else if (currentRegionObj) {
        distanceKm = getDistanceKm(currentRegionObj.center.lat, currentRegionObj.center.lng, listing.lat, listing.lng);
      }
      return { listing, distanceKm };
    });
  }, [listings, userGeoLocation, currentUser, currentRegionObj]);

  const { filteredItems, fallbackReason } = useMemo(() => {
    const targetCountry = currentUser?.country || selectedCountryFilter || 'Nigeria';

    const checkMatch = (
      item: { listing: Listing; distanceKm: number | null },
      scopeLevel: 'strict' | 'country_only' | 'global_proximity'
    ) => {
      const { listing, distanceKm } = item;

      // Favorites tab check
      if (currentTab === 'favorites' && !favorites.includes(listing.id)) return false;

      // Search query filter using location index mapping & keyword expansion
      if (searchQuery.trim()) {
        const matches = matchesLocationSearch(listing, searchQuery);
        if (!matches) return false;
      }

      // Housing Type & Category filter
      const matchesType = 
        selectedType === 'all' || 
        listing.type === selectedType ||
        (selectedType === 'single-room' && (listing.type === 'room' || listing.type === 'single-room')) ||
        (selectedType === 'self-contained' && (listing.type === 'studio' || listing.type === 'self-contained')) ||
        (selectedType === '1-bedroom-flat' && (listing.type === 'apartment' || listing.type === '1-bedroom-flat'));
      if (!matchesType) return false;

      // Price filter
      if (listing.price > maxPrice) return false;

      // Bedrooms filter
      const matchesBedrooms = 
        minBedrooms === 'all' ||
        (minBedrooms === '0' && listing.bedrooms === 0) ||
        (minBedrooms === '1' && listing.bedrooms === 1) ||
        (minBedrooms === '2' && listing.bedrooms === 2) ||
        (minBedrooms === '3+' && listing.bedrooms >= 3);
      if (!matchesBedrooms) return false;

      // Region & Near me filter
      if (selectedRegionId === 'near_me') {
        if (scopeLevel === 'strict' && maxDistanceKm !== null && distanceKm !== null) {
          if (distanceKm > maxDistanceKm) return false;
        }
      } else if (selectedRegionId !== 'all') {
        const region = LAUNCH_REGIONS.find(r => r.id === selectedRegionId);
        if (region) {
          const queryLower = region.name.toLowerCase();
          const matchesName = listing.location.toLowerCase().includes(queryLower) ||
            (listing.city && listing.city.toLowerCase().includes(queryLower)) ||
            (region.country === 'Nigeria' && (
              listing.country?.toLowerCase() === 'nigeria' ||
              listing.location.toLowerCase().includes('nigeria')
            )) ||
            (region.country === 'United Kingdom' && listing.location.toLowerCase().includes('london')) ||
            (region.country === 'Germany' && listing.location.toLowerCase().includes('berlin'));
          const matchesProximity = distanceKm !== null && distanceKm <= 80;
          if (!matchesName && !matchesProximity && scopeLevel === 'strict') return false;
        }
      }

      // Country / State / City Location Scope filter (bypass when Near Me is active)
      if (selectedRegionId !== 'near_me' && (locationScopeMode === 'my_location' || (locationScopeMode === 'custom' && selectedCountryFilter && selectedCountryFilter !== 'all'))) {
        const country = locationScopeMode === 'my_location' ? targetCountry : selectedCountryFilter;

        if (scopeLevel === 'strict' || scopeLevel === 'country_only') {
          const isCountryMatch = 
            (listing.country && listing.country.toLowerCase() === country.toLowerCase()) ||
            listing.location.toLowerCase().includes(country.toLowerCase()) ||
            (country.toLowerCase() === 'nigeria' && (
              (listing.country && listing.country.toLowerCase().includes('nigeria')) ||
              listing.location.toLowerCase().includes('nigeria') ||
              listing.location.toLowerCase().includes('lagos') ||
              listing.location.toLowerCase().includes('abuja') ||
              listing.location.toLowerCase().includes('port harcourt') ||
              listing.location.toLowerCase().includes('uyo') ||
              listing.location.toLowerCase().includes('akwa ibom') ||
              (listing.state && listing.state.toLowerCase().includes('akwa ibom'))
            ));

          if (!isCountryMatch && scopeLevel === 'strict') return false;
        }

        if (scopeLevel === 'strict') {
          if (selectedStateFilter !== 'all') {
            const stateClean = selectedStateFilter.toLowerCase().replace('state', '').trim();
            const matchesState = (listing.state && listing.state.toLowerCase().includes(stateClean)) ||
              listing.location.toLowerCase().includes(stateClean) ||
              (selectedStateFilter.toLowerCase().includes('akwa ibom') && (
                listing.location.toLowerCase().includes('uyo') ||
                (listing.city && listing.city.toLowerCase().includes('uyo'))
              ));
            if (!matchesState) return false;
          }

          if (selectedCityFilter !== 'all') {
            const cityClean = selectedCityFilter.toLowerCase().trim();
            const matchesCity = (listing.city && listing.city.toLowerCase().includes(cityClean)) ||
              listing.location.toLowerCase().includes(cityClean);
            if (!matchesCity) return false;
          }

          if (selectedAreaFilter !== 'all') {
            const matchesArea = listing.location.toLowerCase().includes(selectedAreaFilter.toLowerCase()) ||
              listing.description.toLowerCase().includes(selectedAreaFilter.toLowerCase()) ||
              listing.title.toLowerCase().includes(selectedAreaFilter.toLowerCase());
            if (!matchesArea) return false;
          }
        }
      }

      return true;
    };

    // Pass 1: Strict match
    let items = listingsWithDistance.filter(item => checkMatch(item, 'strict'));
    let reason: 'none' | 'expanded_country' | 'expanded_global' = 'none';

    // Pass 2: Expand to Country-wide if strict scoping yields 0 items
    if (items.length === 0 && (locationScopeMode !== 'all' || selectedRegionId === 'near_me')) {
      const countryItems = listingsWithDistance.filter(item => checkMatch(item, 'country_only'));
      if (countryItems.length > 0) {
        items = countryItems;
        reason = 'expanded_country';
      }
    }

    // Pass 3: Expand Globally sorted by proximity distance if 0 items remain
    if (items.length === 0 && (locationScopeMode !== 'all' || selectedRegionId === 'near_me')) {
      const globalItems = listingsWithDistance.filter(item => checkMatch(item, 'global_proximity'));
      if (globalItems.length > 0) {
        items = globalItems;
        reason = 'expanded_global';
      }
    }

    // Sort items by proximity distance when near_me or fallback is active
    if (selectedRegionId === 'near_me' || reason !== 'none') {
      items.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return { filteredItems: items, fallbackReason: reason };
  }, [
    listingsWithDistance,
    searchQuery,
    selectedRegionId,
    maxDistanceKm,
    locationScopeMode,
    currentUser,
    selectedCountryFilter,
    selectedStateFilter,
    selectedCityFilter,
    selectedAreaFilter,
    selectedType,
    maxPrice,
    minBedrooms,
    currentTab,
    favorites,
  ]);

  // Pagination State & Reset
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedRegionId,
    locationScopeMode,
    selectedCountryFilter,
    selectedStateFilter,
    selectedCityFilter,
    selectedAreaFilter,
    selectedType,
    maxPrice,
    minBedrooms,
    maxDistanceKm,
    currentTab,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Select a property card & scroll/zoom to it
  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    incrementListingViews(listing.id);
    setMapCenter({ lat: listing.lat, lng: listing.lng });
    setMapZoom(14);
    
    // Auto-navigate to page containing listing if not on current page
    const listingIndex = filteredItems.findIndex(item => item.listing.id === listing.id);
    if (listingIndex !== -1) {
      const targetPage = Math.floor(listingIndex / itemsPerPage) + 1;
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    }

    // Smooth scroll into listing element if listed on mobile screen bounds
    setTimeout(() => {
      const element = document.getElementById(`property-card-${listing.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Active Country & Location helper
  const activeCountryName = locationScopeMode === 'my_location' ? (currentUser?.country || selectedCountryFilter || 'Nigeria') : (selectedCountryFilter || 'Nigeria');
  const activeCountryObj = GLOBAL_COUNTRIES.find(
    c => c.name.toLowerCase() === activeCountryName.toLowerCase()
  ) || GLOBAL_COUNTRIES.find(c => c.name === 'Nigeria') || GLOBAL_COUNTRIES[0];

  const selectedLocationName = useMemo(() => {
    if (selectedCityFilter && selectedCityFilter !== 'all') return selectedCityFilter;
    if (selectedStateFilter && selectedStateFilter !== 'all') return selectedStateFilter;
    if (selectedCountryFilter && selectedCountryFilter !== 'all') return selectedCountryFilter;
    if (selectedRegionId && selectedRegionId !== 'all') {
      return LAUNCH_REGIONS.find(r => r.id === selectedRegionId)?.name || 'Europe';
    }
    return 'Global';
  }, [selectedCityFilter, selectedStateFilter, selectedCountryFilter, selectedRegionId]);

  const activeCurrencySymbol = SUPPORTED_CURRENCIES[displayCurrency]?.symbol || '$';

  return (
    <div className="min-h-screen min-h-dvh w-full max-w-full overflow-x-hidden bg-slate-50/50 flex flex-col font-sans select-none antialiased">
      
      {/* CENTRALIZED DYNAMIC SEO METADATA MANAGER */}
      <SEOMetadataManager
        currentTab={currentTab}
        selectedListing={selectedListing}
        filteredCount={filteredItems.length}
        searchQuery={searchQuery}
        selectedType={selectedType}
        selectedLocationName={selectedLocationName}
        currencySymbol={activeCurrencySymbol}
        topListings={filteredItems.slice(0, 10).map(item => item.listing)}
        showInspectorTrigger={true}
        hasCompareBar={comparedListings.length > 0}
      />
      
      {/* PREMIUM HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm/50 px-3 sm:px-4 lg:px-8 py-3 pt-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo and Tagline */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleTabChange('explore')}>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-600/10 transition-transform hover:scale-105">
              <Building className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-slate-800">Rentora</span>
              <span className="text-[10px] text-emerald-600 font-bold block -mt-1 uppercase tracking-wider">RealEstate</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl">
            <button
              onClick={() => handleTabChange('explore')}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                currentTab === 'explore'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Explore Homes
            </button>
            {currentUser?.role === 'landlord' && (
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Analytics Dashboard
              </button>
            )}
            <button
              onClick={() => handleTabChange('bookings')}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                currentTab === 'bookings'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {currentUser?.role === 'landlord' ? 'Owner Approvals Hub' : 'My Bookings'}
            </button>
          </nav>

          {/* User Auth Action Center */}
          <div className="flex items-center gap-2 relative">
            {/* Header Compare Button */}
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className={`flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl transition-all border cursor-pointer relative ${
                comparedListings.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Compare selected properties side-by-side"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
              {comparedListings.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] flex items-center justify-center shrink-0">
                  {comparedListings.length}
                </span>
              )}
            </button>

            {/* Direct Header Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-2.5 rounded-xl transition-all border border-slate-200 cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle dark mode theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* In-App Notification Bell */}
            <NotificationBell
              currentUser={currentUser}
              bookings={bookings}
              listings={listings}
              onNavigateTab={handleTabChange}
            />

            <button
              onClick={() => setShowEmailLogsModal(true)}
              className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-700 shadow-xs cursor-pointer"
              title="Inspect Landlord Booking Email Alerts & EmailJS Logs"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Email Alerts</span>
            </button>

            {currentUser?.role === 'landlord' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>List Property</span>
              </button>
            )}

            {/* Profile Avatar / Quick Switch Button */}
            <button
              onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 p-1.5 pr-3.5 rounded-xl transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {currentUser?.name ? currentUser.name.slice(0, 2) : 'G'}
              </div>
              <div className="hidden lg:block">
                <span className="font-bold text-slate-700 text-xs block leading-tight">
                  {currentUser?.name || 'Guest User'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block -mt-0.5">
                  {currentUser?.role === 'landlord' ? 'Landlord / Owner' : 'Tenant / Guest'}
                  {currentUser?.city ? ` • ${currentUser.city}` : ''}
                </span>
              </div>
            </button>

            {/* Auth Identity Dropdown Panel */}
            {showAuthDropdown && (
              <div className="absolute right-0 top-full mt-2.5 w-[320px] bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-fade-in">
                {/* Theme Mode Toggle Banner in Profile Dropdown */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-600'
                    }`}>
                      {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs block leading-tight">
                        {isDarkMode ? 'Dark Theme' : 'Light Theme'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {isDarkMode ? 'Eye-friendly night mode' : 'High contrast light mode'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    aria-label="Toggle dark mode theme"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        isDarkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {isDarkMode ? (
                        <Moon className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <Sun className="w-3 h-3 text-amber-500" />
                      )}
                    </span>
                  </button>
                </div>

                {/* Current Active Account Card */}
                {currentUser ? (
                  <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Logged In Account</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        currentUser.role === 'landlord' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {currentUser.role === 'landlord' ? 'Landlord / Owner' : 'Tenant / Guest'}
                      </span>
                    </div>

                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block truncate">{currentUser.name}</span>
                      <span className="text-[11px] text-slate-500 block truncate">{currentUser.email}</span>
                    </div>

                    {(currentUser.city || currentUser.country) && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg flex items-center gap-1 mt-1 truncate min-w-0">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{[currentUser.city, currentUser.state, currentUser.country].filter(Boolean).join(', ')}</span>
                      </span>
                    )}

                    {/* Edit Profile Button */}
                    <button
                      onClick={() => {
                        setShowAuthDropdown(false);
                        setShowEditProfileModal(true);
                      }}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Edit &amp; Update Profile</span>
                    </button>

                    {/* Landlord Email Notification Logs */}
                    <button
                      onClick={() => {
                        setShowAuthDropdown(false);
                        setShowEmailLogsModal(true);
                      }}
                      className="w-full mt-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Landlord Email Alerts Hub</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                    You are browsing as Guest. Sign up or log in to manage your profile.
                  </div>
                )}

                {/* Sign Up / Log In options without hardcoded demo user switcher */}
                <div className="space-y-2 border-t border-slate-100 pt-2.5">
                  <button
                    onClick={() => {
                      setShowAuthDropdown(false);
                      setAuthModalMode('signup');
                      setShowAuthModal(true);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Create New Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAuthDropdown(false);
                      setAuthModalMode('login');
                      setShowAuthModal(true);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <span>Log In to Existing Account</span>
                  </button>
                </div>

                {/* Log Out */}
                {currentUser && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowAuthDropdown(false);
                    }}
                    className="w-full py-2 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-dashed border-rose-200 cursor-pointer mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION DOCK (STICKY AT BOTTOM FOR ACCESSIBILITY) */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        favoritesCount={favorites.length}
        comparedCount={comparedListings.length}
        bookingsCount={currentUser ? bookings.length : 0}
        onOpenCompare={() => setShowCompareModal(true)}
        onOpenProfile={() => setShowAuthDropdown(true)}
        onOpenAddListing={currentUser?.role === 'landlord' ? () => setShowAddModal(true) : undefined}
        currentUser={currentUser}
      />

      {/* FLOATING MAP / LIST TOGGLE BUTTON ON MOBILE (FLIPX / AIRBNB UX) */}
      {(currentTab === 'explore' || currentTab === 'favorites') && (
        <div className={`md:hidden fixed ${comparedListings.length > 0 ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+10rem)]' : 'bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)]'} left-1/2 -translate-x-1/2 z-30 animate-fade-in pointer-events-auto transition-all duration-300`}>
          <button
            type="button"
            onClick={() => handleSetMapViewMode(mapViewMode === 'map' ? (recentViewMode !== 'map' ? recentViewMode : 'grid') : 'map')}
            className="bg-slate-900 text-white dark:bg-emerald-600 dark:text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black ring-4 ring-white/50 dark:ring-slate-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-slate-700/50"
          >
            {mapViewMode === 'map' ? (
              <>
                <GridIcon className="w-4 h-4 text-emerald-400 dark:text-white stroke-[2.5]" />
                <span>Show List</span>
              </>
            ) : (
              <>
                <MapIcon className="w-4 h-4 text-emerald-400 dark:text-white stroke-[2.5]" />
                <span>Map View</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* CORE VIEWPORT */}
      <main className={`flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-8 ${comparedListings.length > 0 ? 'mb-36 md:mb-14' : 'mb-24 md:mb-8'} overflow-hidden min-w-0 transition-all duration-300`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {currentTab === 'explore' ? (
              isTabLoading ? (
                <ExploreTabSkeleton />
              ) : (
                // DUAL-PANE EXPLORE MODE
                <div className="space-y-6">
            
            {/* SEARCH AND FILTERS BAR */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 lg:p-5 space-y-4">
              
              {/* Row 1: Search and Quick Control Action Buttons */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <PlacesAutocompleteSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSelectLocation={(loc) => {
                      if (loc.lat && loc.lng) {
                        setMapCenter({ lat: loc.lat, lng: loc.lng });
                        setMapZoom(loc.zoom || 14);
                      }
                    }}
                    listings={listings}
                  />
                </div>

                {/* Quick Action Buttons Row (Horizontal Scroll on Mobile) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-0.5">
                  {/* GPS Locate Me Button */}
                  <button
                    type="button"
                    onClick={handleGetUserLocation}
                    disabled={isLocatingUser}
                    className={`px-3 py-2 border rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      selectedRegionId === 'near_me'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {isLocatingUser ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : (
                      <LocateFixed className="w-4 h-4 text-emerald-500" />
                    )}
                    <span>Near Me</span>
                  </button>

                  {/* Filter Panel Toggle */}
                  <button
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className={`px-3.5 py-2 border rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      showFiltersPanel || selectedType !== 'all' || minBedrooms !== 'all' || maxPrice < 2000 || maxDistanceKm !== null
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                  </button>

                  {/* Rent Affordability Calculator Button */}
                  <button
                    type="button"
                    onClick={() => setShowAffordabilityCalculatorModal(true)}
                    className="px-3 py-2 border border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    title="Open Rent Affordability Calculator"
                  >
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>Rent Calc</span>
                  </button>

                  {/* Save Search Alert Button */}
                  <button
                    type="button"
                    onClick={() => setShowSavedSearchAlertModal(true)}
                    className="px-3 py-2 border border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    title="Save Search & Get Instant Property Alerts"
                  >
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span>Save Alert</span>
                  </button>
                </div>
              </div>

              {/* LOCATION SCOPING BAR (Signup Location, Country/State/City filters) */}
              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  
                  {/* Scope Mode Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span className="hidden sm:inline">Scope:</span>
                    </span>

                    {/* Mode 1: My Signup Location */}
                    <button
                      type="button"
                      onClick={() => {
                        setLocationScopeMode('my_location');
                        if (currentUser?.country) {
                          setSelectedCountryFilter(currentUser.country);
                        }
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        locationScopeMode === 'my_location'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <span>{activeCountryObj.flag} My Location</span>
                      {currentUser && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-black hidden xs:inline">
                          {currentUser.city || currentUser.state || 'Match Profile'}
                        </span>
                      )}
                    </button>

                    {/* Mode 2: Custom Country / State Filter */}
                    <button
                      type="button"
                      onClick={() => setLocationScopeMode('custom')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        locationScopeMode === 'custom'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Filter by Country/State</span>
                      <span className="xs:hidden">Filter</span>
                    </button>

                    {/* Mode 3: All Global Locations */}
                    <button
                      type="button"
                      onClick={() => {
                        setLocationScopeMode('all');
                        setSelectedStateFilter('all');
                        setSelectedCityFilter('all');
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        locationScopeMode === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>All Global</span>
                    </button>
                  </div>

                  {/* Right Side: Currency Auto-Detect Badge & Property Count */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                    
                    {/* Auto-Detected Currency Selector Pill */}
                    <div className="relative flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs shadow-2xs transition-all hover:border-emerald-300 max-w-full">
                      <span className="text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider shrink-0 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">Currency:</span>
                      </span>
                      
                      <div className="flex items-center gap-1 min-w-0 shrink">
                        <span className="text-emerald-700 font-extrabold text-xs whitespace-nowrap">
                          {SUPPORTED_CURRENCIES[displayCurrency]?.flag} {displayCurrency} ({SUPPORTED_CURRENCIES[displayCurrency]?.symbol})
                        </span>
                        {isDetectingCurrency ? (
                          <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin shrink-0" />
                        ) : (
                          <span 
                            title={currencySourceInfo.label}
                            className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden md:inline-block cursor-help shrink-0"
                          >
                            {currencySourceInfo.source === 'profile'
                              ? 'Profile Auto'
                              : currencySourceInfo.source === 'ip'
                              ? 'IP Detected'
                              : currencySourceInfo.source === 'override'
                              ? 'Custom'
                              : 'Auto'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCurrencyConverterModal(true)}
                        className="ml-1 pl-1.5 border-l border-slate-200 text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 font-extrabold text-[10px] shrink-0 relative z-20 cursor-pointer"
                        title="Open FX Currency Calculator"
                      >
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden lg:inline">FX Calc</span>
                      </button>

                      {/* Overlay native select element so tapping anywhere on the pill opens currency selection smoothly */}
                      <select
                        value={displayCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        aria-label="Select Local Display Currency"
                      >
                        {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.symbol}) - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Property Count Badge */}
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span><strong className="text-slate-800">{filteredItems.length}</strong> listings</span>
                    </div>
                  </div>
                </div>

                {/* Country, State, City & Neighborhood/Area Dropdown Selectors */}
                {locationScopeMode !== 'all' && (() => {
                  const statesList = getStatesForCountry(activeCountryName);
                  const citiesList = getCitiesForState(activeCountryName, selectedStateFilter);
                  const areasList = getAreasForCity(activeCountryName, selectedStateFilter, selectedCityFilter);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60 animate-fade-in">
                      
                      {/* Country Selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Country</label>
                        <select
                          value={locationScopeMode === 'my_location' ? (currentUser?.country || selectedCountryFilter) : selectedCountryFilter}
                          onChange={(e) => {
                            setSelectedCountryFilter(e.target.value);
                            setSelectedStateFilter('all');
                            setSelectedCityFilter('all');
                            setSelectedAreaFilter('all');
                            if (locationScopeMode === 'my_location') {
                              setLocationScopeMode('custom');
                            }
                            // Recenter map to country capital
                            if (e.target.value.toLowerCase() === 'nigeria') {
                              setMapCenter({ lat: 6.4531, lng: 3.3958 });
                              setMapZoom(11);
                            } else if (e.target.value.toLowerCase() === 'spain') {
                              setMapCenter({ lat: 40.4167, lng: -3.7037 });
                              setMapZoom(11);
                            } else if (e.target.value.toLowerCase() === 'united kingdom') {
                              setMapCenter({ lat: 51.5074, lng: -0.1278 });
                              setMapZoom(11);
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          {GLOBAL_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* State / Province Selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State / Region</label>
                        <select
                          value={selectedStateFilter}
                          onChange={(e) => {
                            setSelectedStateFilter(e.target.value);
                            setSelectedCityFilter('all');
                            setSelectedAreaFilter('all');
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="all">All States / Regions ({statesList.length})</option>
                          {statesList.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* City / District Selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">City / District</label>
                        <select
                          value={selectedCityFilter}
                          onChange={(e) => {
                            setSelectedCityFilter(e.target.value);
                            setSelectedAreaFilter('all');
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="all">All Cities ({citiesList.length})</option>
                          {citiesList.map((ct) => (
                            <option key={ct} value={ct}>
                              {ct}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Neighborhood / Sub-Area Selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Neighborhood / Area</label>
                        <select
                          value={selectedAreaFilter}
                          onChange={(e) => setSelectedAreaFilter(e.target.value)}
                          disabled={areasList.length === 0}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-100 cursor-pointer"
                        >
                          <option value="all">
                            {areasList.length > 0 ? `All Neighborhoods (${areasList.length})` : 'Select Location for Sub-areas'}
                          </option>
                          {areasList.map((ar) => (
                            <option key={ar} value={ar}>
                              {ar}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Interactive Neighborhood Chips Bar */}
                      {areasList.length > 0 && (
                        <div className="col-span-1 sm:col-span-2 md:col-span-4 pt-1 flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mr-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>Neighborhoods ({areasList.length}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedAreaFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${
                              selectedAreaFilter === 'all'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            All Areas
                          </button>
                          {areasList.map((ar) => {
                            const isSelected = selectedAreaFilter.toLowerCase() === ar.toLowerCase();
                            return (
                              <button
                                key={`chip-${ar}`}
                                type="button"
                                onClick={() => setSelectedAreaFilter(isSelected ? 'all' : ar)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                              >
                                {ar}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Horizontal Launch Region Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-2 no-scrollbar border-t border-slate-100/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0 mr-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>Markets:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectRegion('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedRegionId === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span>🌍 All Launch Markets</span>
                </button>

                {LAUNCH_REGIONS.map((region) => {
                  const isActive = selectedRegionId === region.id;
                  // Calculate listings in this region
                  const regionCount = listings.filter(l => 
                    l.location.toLowerCase().includes(region.name.toLowerCase()) ||
                    (region.country === 'Nigeria' && l.location.toLowerCase().includes('lagos')) ||
                    (region.country === 'United Kingdom' && l.location.toLowerCase().includes('london')) ||
                    (region.country === 'Germany' && l.location.toLowerCase().includes('berlin'))
                  ).length;

                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => handleSelectRegion(region.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span>{region.flag} {region.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {regionCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Distance Radius Filter Selector (shown when Near Me or Radius active) */}
              {(selectedRegionId === 'near_me' || maxDistanceKm !== null) && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100/80 animate-fade-in">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide shrink-0 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-emerald-600" />
                    <span>Distance Radius:</span>
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {[5, 10, 25, 50, 100, null].map((radius) => (
                      <button
                        key={radius === null ? 'any' : radius}
                        type="button"
                        onClick={() => setMaxDistanceKm(radius)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          maxDistanceKm === radius
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {radius === null ? 'Any Distance' : `≤ ${radius} km`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Horizontal Category Pill Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 no-scrollbar border-t border-slate-100/80">
                <button
                  type="button"
                  onClick={() => setSelectedType('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    selectedType === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  All Categories
                </button>
                {PROPERTY_CATEGORY_OPTIONS.map((cat) => {
                  const isActive = selectedType === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedType(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Secondary Filters Drawer Panel */}
              {(showFiltersPanel || selectedType !== 'all' || minBedrooms !== 'all' || maxPrice < 2000) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3.5 border-t border-slate-100 animate-fade-in">
                  
                  {/* Filter Property Type Dropdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Property Category Filter</span>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Real Estate Categories</option>
                      {PROPERTY_CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({cat.description})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Price Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Max Price</span>
                      <span className="text-xs font-bold text-emerald-600">€{maxPrice}/mo</span>
                    </div>
                    <input
                      type="range"
                      min={400}
                      max={2200}
                      step={50}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>€400</span>
                      <span>€1,300</span>
                      <span>€2,200+</span>
                    </div>
                  </div>

                  {/* Filter Bedrooms count */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Minimum Bedrooms</span>
                    <div className="flex gap-1.5">
                      {['all', '0', '1', '2', '3+'].map(b => (
                        <button
                          key={b}
                          onClick={() => setMinBedrooms(b)}
                          className={`w-10 h-8 rounded-xl font-bold text-xs border flex items-center justify-center transition-all ${
                            minBedrooms === b
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          {b === 'all' ? 'Any' : b}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* VIEW MODE CONTROL BAR & LISTING HEADER */}
            <div id="property-feed-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-display font-black text-slate-800 dark:text-white text-sm sm:text-base md:text-lg flex items-center gap-1.5 min-w-0 truncate">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {selectedRegionId === 'near_me'
                      ? 'Homes Near Your GPS Location'
                      : selectedRegionId === 'all'
                      ? 'All Active Launch Markets'
                      : `Homes in ${currentRegionObj?.name || selectedRegionId} ${currentRegionObj?.flag || ''}`}
                  </span>
                </h3>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shrink-0">
                  {filteredItems.length} properties
                </span>
              </div>

              {/* View Switcher Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                {/* Dedicated Collapse/Expand Showcase Button */}
                <button
                  type="button"
                  onClick={toggleMapCollapse}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    mapViewMode === 'grid'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-100 border-slate-800 shadow-xs'
                  }`}
                  title={mapViewMode === 'grid' ? "Expand Hot Properties Showcase Reel" : "Collapse Showcase Reel"}
                >
                  {mapViewMode === 'grid' ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                      <span className="text-xs">Showcase Reel</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="text-xs">Hide Reel</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSetMapViewMode('grid')}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      mapViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Grid view only"
                  >
                    <GridIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden md:inline">Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetMapViewMode('split')}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      mapViewMode === 'split'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Side-by-side properties & hot showcase reel"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="hidden md:inline">Split</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetMapViewMode('map')}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      mapViewMode === 'map'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Full-screen Hot Properties Showcase Reel"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="hidden md:inline font-bold text-rose-500">Showcase</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Fallback & Expansion Notice Banner */}
            {fallbackReason !== 'none' && (
              <div className="bg-emerald-50 dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {fallbackReason === 'expanded_country' 
                          ? `Verified Properties in ${currentUser?.country || selectedCountryFilter}`
                          : 'Nearest Verified Properties'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                        {currentUser?.city ? `${currentUser.city}, ${currentUser.country}` : currentUser?.country || 'User Profile'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {fallbackReason === 'expanded_country'
                        ? `New properties in ${currentUser?.city || 'your city'} are undergoing background verification. Showing verified listings across ${currentUser?.country || selectedCountryFilter}.`
                        : `Listings directly in ${currentUser?.city || currentUser?.country || 'your city'} are currently being verified. Displaying nearest verified properties sorted by proximity.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLocationScopeMode('all');
                    setSelectedRegionId('all');
                    setSelectedStateFilter('all');
                    setSelectedCityFilter('all');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer shadow-xs self-end sm:self-auto"
                >
                  Explore All Global Homes
                </button>
              </div>
            )}

            {/* DUAL PANE LISTING ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] h-auto lg:h-[calc(100vh-270px)]">
              
              {/* Left Column: Property Feed */}
              <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${
                mapViewMode === 'grid' 
                  ? 'lg:col-span-12' 
                  : mapViewMode === 'map' 
                  ? 'lg:col-span-4' 
                  : 'lg:col-span-7'
              }`}>

                <PullToRefresh
                  onRefresh={refreshData}
                  isRefreshing={isSyncingDatabase}
                  className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin"
                >
                  {isLoadingListings ? (
                    <div className={`grid gap-4 ${
                      mapViewMode === 'grid'
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : mapViewMode === 'map'
                        ? 'grid-cols-1'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}>
                      {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <PropertyCardSkeleton key={idx} />
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 max-w-md mx-auto my-6 shadow-sm">
                      <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <img 
                          src={emptySearchImg} 
                          alt="No rentals found illustration" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">No rentals match your search</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Try adjusting your pricing filters, location radius, or property type to discover available homes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegionId('all');
                          setSelectedType('all');
                          setMaxPrice(2000);
                          setSearchQuery('');
                          setMinBedrooms('all');
                          setMaxDistanceKm(null);
                          setUserGeoLocation(null);
                        }}
                        className="py-2 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      {isVirtualizedScroll ? (
                        <div className="h-[calc(100vh-320px)] min-h-[500px]">
                          <VirtualizedPropertyList
                            items={filteredItems}
                            displayCurrency={displayCurrency}
                            selectedListingId={selectedListing?.id}
                            onSelectListing={handleSelectListing}
                            favorites={favorites}
                            onToggleFavorite={(id) => {
                              handleToggleFavorite(id);
                            }}
                            comparedListingIds={comparedListings.map((l) => l.id)}
                            onToggleCompare={(listing) => {
                              toggleCompareListing(listing);
                            }}
                            mapViewMode={mapViewMode}
                          />
                        </div>
                      ) : (
                        <motion.div
                          key={`feed-${currentPage}-${itemsPerPage}-${selectedType}-${selectedRegionId}-${searchQuery}-${selectedStateFilter}-${selectedCityFilter}-${selectedAreaFilter}-${minBedrooms}-${maxPrice}-${maxDistanceKm}-${mapViewMode}`}
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className={`grid gap-4 ${
                            mapViewMode === 'grid'
                              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                              : mapViewMode === 'map'
                              ? 'grid-cols-1'
                              : 'grid-cols-1 sm:grid-cols-2'
                          }`}
                        >
                          {paginatedItems.map(({ listing, distanceKm }) => (
                            <motion.div key={listing.id} variants={staggerItemVariants}>
                              <PropertyCard
                                listing={listing}
                                distanceKm={distanceKm}
                                displayCurrency={displayCurrency}
                                isSelected={selectedListing?.id === listing.id}
                                onClick={() => handleSelectListing(listing)}
                                isFavorited={favorites.includes(listing.id)}
                                onToggleFavorite={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(listing.id);
                                }}
                                isCompared={comparedListings.some((l) => l.id === listing.id)}
                                onToggleCompare={(e) => {
                                  e.stopPropagation();
                                  toggleCompareListing(listing);
                                }}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {/* PAGINATION & VIRTUALIZATION CONTROLS */}
                      {filteredItems.length > 0 && (
                        <div className="mt-6 pt-4 pb-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                          {/* Status text & items per page selector */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                            <span>
                              {isVirtualizedScroll ? (
                                <>Displaying <strong className="font-bold text-slate-800 dark:text-slate-200">{filteredItems.length}</strong> rentals (Virtual Stream)</>
                              ) : (
                                <>Showing <strong className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</strong>–<strong className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</strong> of <strong className="font-bold text-slate-800 dark:text-slate-200">{filteredItems.length}</strong> rentals</>
                              )}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            
                            {/* Virtualized Stream Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setIsVirtualizedScroll(!isVirtualizedScroll)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                isVirtualizedScroll
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                              title="Toggle ultra-fast virtualized 60 FPS scrolling for large feeds"
                            >
                              <Zap className={`w-3.5 h-3.5 ${isVirtualizedScroll ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400'}`} />
                              <span>{isVirtualizedScroll ? 'Virtual Stream Active' : 'Virtual Scroll'}</span>
                            </button>

                            {!isVirtualizedScroll && (
                              <div className="flex items-center gap-1.5">
                                <span>Per page:</span>
                                <select
                                  value={itemsPerPage}
                                  onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                  }}
                                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                  <option value={6}>6</option>
                                  <option value={12}>12</option>
                                  <option value={24}>24</option>
                                  <option value={48}>48</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Page Navigation Buttons */}
                          {!isVirtualizedScroll && totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentPage > 1) {
                                    setCurrentPage(prev => prev - 1);
                                    document.getElementById('property-feed-top')?.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                                aria-label="Previous Page"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>

                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                const isFirst = pageNum === 1;
                                const isLast = pageNum === totalPages;
                                const isAdjacent = Math.abs(pageNum - currentPage) <= 1;

                                if (isFirst || isLast || isAdjacent) {
                                  return (
                                    <button
                                      key={pageNum}
                                      type="button"
                                      onClick={() => {
                                        setCurrentPage(pageNum);
                                        document.getElementById('property-feed-top')?.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        currentPage === pageNum
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                } else if (
                                  (pageNum === 2 && currentPage > 3) ||
                                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                ) {
                                  return (
                                    <span key={pageNum} className="px-0.5 text-slate-400 dark:text-slate-600 text-xs font-bold">
                                      ...
                                    </span>
                                  );
                                }
                                return null;
                              })}

                              <button
                                type="button"
                                onClick={() => {
                                  if (currentPage < totalPages) {
                                    setCurrentPage(prev => prev + 1);
                                    document.getElementById('property-feed-top')?.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                                aria-label="Next Page"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </PullToRefresh>
              </div>

              {/* Right Column: Hot Properties & New Listings Showcase Reel */}
              {mapViewMode !== 'grid' && (
                <div className={`transition-all duration-300 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0 ${
                  mapViewMode === 'map'
                    ? 'lg:col-span-8 h-[580px] lg:h-full'
                    : 'lg:col-span-5 h-[520px] sm:h-[560px] lg:h-full'
                }`}>
                  <HotPropertiesShowcase
                    listings={filteredItems.map(item => item.listing)}
                    selectedListing={selectedListing}
                    onSelectListing={handleSelectListing}
                    favorites={favorites}
                    onToggleFavorite={(e, listingId) => {
                      e.stopPropagation();
                      handleToggleFavorite(listingId);
                    }}
                    onBookTour={handleSelectListing}
                    displayCurrency={displayCurrency}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                  />
                </div>
              )}

            </div>

            {/* PROMOTIONAL BANNER SECTION */}
            <PromotionalBanner
              onListPropertyClick={() => setShowAddModal(true)}
              onExploreClick={() => {
                setSelectedType('all');
                setSelectedRegionId('all');
              }}
            />

          </div>
            )
        ) : currentTab === 'dashboard' ? (
          isTabLoading ? (
            <LandlordDashboardSkeleton />
          ) : (
            <LandlordDashboard
              currentUser={currentUser}
              listings={listings}
              bookings={bookings}
              onAddListingClick={() => setShowAddModal(true)}
              onViewBookingClick={() => handleTabChange('bookings')}
              onViewListingClick={(listing) => {
                setSelectedListing(listing);
                incrementListingViews(listing.id);
                handleTabChange('explore');
              }}
              onRefreshData={refreshData}
              onEditProfileClick={() => setShowEditProfileModal(true)}
            />
          )
        ) : currentTab === 'favorites' ? (
          isTabLoading ? (
            <FavoritesTabSkeleton />
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                    <span>Your Saved Properties</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {favorites.length} home{favorites.length === 1 ? '' : 's'} saved to your wishlist for quick access and comparison.
                  </p>
                </div>
                {favorites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleTabChange('explore')}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    Explore More
                  </button>
                )}
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 max-w-md mx-auto my-6 shadow-sm">
                  <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <img 
                      src={emptySavedImg} 
                      alt="No saved properties illustration" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">No saved properties yet</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Click the heart icon on any property card while exploring to save your top favorite rentals.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('explore')}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    <span>Browse Rentals Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <motion.div
                  key={`favs-${favorites.join('-')}`}
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {listings
                    .filter((l) => favorites.includes(l.id))
                    .map((listing) => (
                      <motion.div key={listing.id} variants={staggerItemVariants}>
                        <PropertyCard
                          listing={listing}
                          displayCurrency={displayCurrency}
                          isSelected={selectedListing?.id === listing.id}
                          onClick={() => handleSelectListing(listing)}
                          isFavorited={true}
                          onToggleFavorite={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(listing.id);
                          }}
                          isCompared={comparedListings.some((l) => l.id === listing.id)}
                          onToggleCompare={(e) => {
                            e.stopPropagation();
                            toggleCompareListing(listing);
                          }}
                        />
                      </motion.div>
                    ))}
                </motion.div>
              )}
            </div>
          )
        ) : (
          
          // BOOKINGS & OWNER APPROVAL HUB
          isTabLoading ? (
            <BookingsViewSkeleton />
          ) : (
            <div className="animate-fade-in bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8">
              <BookingsView 
                currentUser={currentUser}
                onStatusChanged={refreshData}
              />
            </div>
          )
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* COMPREHENSIVE FOOTER SECTION */}
      <Footer
        displayCurrency={displayCurrency}
        onCurrencyChange={handleCurrencyChange}
        onSelectType={(type) => {
          setSelectedType(type);
          setCurrentTab('explore');
        }}
        onOpenAuth={(role) => {
          setAuthModalRole(role === 'tenant' ? 'guest' : role);
          setAuthModalMode('signup');
          setShowAuthModal(true);
        }}
        onListPropertyClick={() => setShowAddModal(true)}
        onSelectLocation={(loc) => {
          setSearchQuery(loc);
          setCurrentTab('explore');
        }}
        onSelectArea={(area) => {
          setSelectedAreaFilter(area);
          setCurrentTab('explore');
        }}
      />

      {/* POPUP: PROPERTY DETAIL DRAWER MODAL */}
      <AnimatePresence>
        {selectedListing && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center gap-4 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading property details...</p>
              </div>
            </div>
          }>
            <PropertyDetails
              listing={selectedListing}
              allListings={listings}
              onSelectListing={(newListing) => {
                setSelectedListing(newListing);
              }}
              currentUser={currentUser}
              displayCurrency={displayCurrency}
              favorites={favorites}
              onToggleFavorite={(listingId) => {
                handleToggleFavorite(listingId);
              }}
              onClose={() => setSelectedListing(null)}
              onBookingCreated={() => {
                setSelectedListing(null);
                setCurrentTab('bookings');
                refreshData();
              }}
              onSwitchToGuest={() => {
                setAuthModalRole('guest');
                setAuthModalMode('login');
                setShowAuthModal(true);
              }}
              isCompared={comparedListings.some((l) => l.id === selectedListing.id)}
              onToggleCompare={() => toggleCompareListing(selectedListing)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* FLOATING COMPARE ACTION BAR */}
      <CompareBar
        comparedListings={comparedListings}
        onOpenModal={() => setShowCompareModal(true)}
        onRemove={removeCompareListing}
        onClear={clearCompareListings}
      />

      <Suspense fallback={null}>
        {/* POPUP: COMPARE PROPERTIES SIDE-BY-SIDE MODAL */}
        <ComparePropertiesModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
          listings={listings}
          comparedListings={comparedListings}
          displayCurrency={displayCurrency}
          onRemoveCompare={removeCompareListing}
          onAddCompare={toggleCompareListing}
          onClearCompare={clearCompareListings}
          onSelectListingDetails={(listing) => setSelectedListing(listing)}
        />

        {/* POPUP: ADD LISTING STEPPER MODAL */}
        {showAddModal && (
          <AddListingModal
            currentUser={currentUser}
            onClose={() => setShowAddModal(false)}
            onListingCreated={() => {
              setShowAddModal(false);
              refreshData();
            }}
          />
        )}

        {/* POPUP: EDIT PROFILE MODAL */}
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          currentUser={currentUser}
          onSaveSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            refreshData();
          }}
        />

        {/* POPUP: EMAIL NOTIFICATIONS LOGS MODAL */}
        <EmailLogModal
          isOpen={showEmailLogsModal}
          onClose={() => setShowEmailLogsModal(false)}
          landlordEmail={currentUser?.email}
        />

        {/* POPUP: FX CURRENCY CONVERTER MODAL */}
        <CurrencyConverterModal
          isOpen={showCurrencyConverterModal}
          onClose={() => setShowCurrencyConverterModal(false)}
          activeCurrency={displayCurrency}
          onSelectCurrency={(code) => {
            handleCurrencyChange(code);
            setShowCurrencyConverterModal(false);
          }}
        />

        {/* POPUP: RENT AFFORDABILITY & MOVE-IN CASH CALCULATOR MODAL */}
        <RentAffordabilityCalculatorModal
          isOpen={showAffordabilityCalculatorModal}
          onClose={() => setShowAffordabilityCalculatorModal(false)}
          userCurrency={displayCurrency}
          onApplyBudgetToFilter={(maxBudgetUSD) => {
            setMaxPrice(maxBudgetUSD);
            toast.success('Rent Budget Applied', `Maximum price filter set to $${maxBudgetUSD.toLocaleString()} USD equivalent.`);
          }}
        />

        {/* POPUP: SAVED SEARCH & INSTANT ALERTS MODAL */}
        <SavedSearchAlertModal
          isOpen={showSavedSearchAlertModal}
          onClose={() => setShowSavedSearchAlertModal(false)}
          currentSearchQuery={searchQuery}
          selectedCountry={selectedCountryFilter}
          selectedCity={selectedCityFilter}
          selectedArea={selectedAreaFilter}
          selectedCategory={selectedType}
          maxPrice={maxPrice.toString()}
          userEmail={currentUser?.email || ''}
        />
      </Suspense>

      {/* POPUP: COMPREHENSIVE SIGN UP & AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal || !currentUser}
        isMandatory={!currentUser}
        onClose={() => {
          if (currentUser) {
            setShowAuthModal(false);
          } else {
            toast.warning('Authentication Required', 'Please sign in or create an account to access Rentora.');
          }
        }}
        initialRole={authModalRole}
        initialMode={authModalMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          toast.success('Authentication Successful', `Welcome, ${user.name || user.email}!`);
          refreshData();
          if (!user.country || !user.state || !user.city) {
            setShowLocationOnboarding(true);
          }
        }}
      />

      {/* POPUP: LOCATION REGION ONBOARDING MODAL */}
      {showLocationOnboarding && currentUser && (
        <LocationOnboardingModal
          currentUser={currentUser}
          canDismiss={Boolean(currentUser.country && currentUser.state && currentUser.city)}
          onClose={() => {
            setShowLocationOnboarding(false);
            sessionStorage.setItem(`rentora_dismissed_loc_onboard_${currentUser.id}`, 'true');
          }}
          onLocationSaved={(updatedUser) => {
            setCurrentUser(updatedUser);
            setShowLocationOnboarding(false);
            refreshData();
          }}
        />
      )}

    </div>
  );
}
