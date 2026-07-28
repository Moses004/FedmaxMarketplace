import React, { useState, useEffect } from 'react';
import { Listing, User, PropertyType, PROPERTY_CATEGORY_OPTIONS } from './types';
import { 
  getListings, getCurrentUser, login, logout, getBookings, getFavorites, toggleFavorite,
  getListingViews, incrementListingViews
} from './services/store';
import PropertyMap from './components/PropertyMap';
import PropertyCard from './components/PropertyCard';
import PropertyDetails from './components/PropertyDetails';
import BookingsView from './components/BookingsView';
import AddListingModal from './components/AddListingModal';
import LandlordDashboard from './components/LandlordDashboard';
import AuthModal from './components/AuthModal';
import EditProfileModal from './components/EditProfileModal';
import PromotionalBanner from './components/PromotionalBanner';
import Footer from './components/Footer';
import { 
  Building, Search, MapPin, Euro, Compass, Calendar, 
  User as UserIcon, Plus, Filter, RefreshCw, Sparkles, SlidersHorizontal, ChevronRight, LogOut, Check,
  BarChart3, Navigation, Globe, LocateFixed, UserPlus, ShieldCheck
} from 'lucide-react';
import { LAUNCH_REGIONS, getDistanceKm, getCurrentUserCoordinates } from './utils/location';

export default function App() {
  // Core App Views
  const [currentTab, setCurrentTab] = useState<'explore' | 'bookings' | 'dashboard'>('explore');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Filter & Region States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  const [userGeoLocation, setUserGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [minBedrooms, setMinBedrooms] = useState<string>('all');

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authRole, setAuthRole] = useState<'guest' | 'landlord'>('guest');
  const [authName, setAuthName] = useState('');
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);

  // Full Sign Up / Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'guest' | 'landlord'>('guest');
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login'>('signup');

  // Map Coordinates State
  const [mapCenter, setMapCenter] = useState({ lat: 40.4167, lng: -3.7037 }); // Madrid default
  const [mapZoom, setMapZoom] = useState(13);

  // Refresh lists and auth states
  const refreshData = () => {
    setListings(getListings());
    setCurrentUser(getCurrentUser());
    setFavorites(getFavorites());
  };

  useEffect(() => {
    refreshData();
  }, []);

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
      if (!maxDistanceKm) setMaxDistanceKm(25);
    } catch (err) {
      console.warn("User geolocation error:", err);
    } finally {
      setIsLocatingUser(false);
    }
  };

  // Quick Login Utility
  const handleQuickLogin = (email: string, role: 'guest' | 'landlord', name: string) => {
    const user = login(email, role, name);
    setCurrentUser(user);
    setCurrentTab('explore');
    setShowAuthDropdown(false);
    refreshData();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    const user = login(authEmail, authRole, authName);
    setCurrentUser(user);
    setCurrentTab('explore');
    setAuthEmail('');
    setAuthName('');
    setShowAuthDropdown(false);
    refreshData();
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentTab('explore');
    refreshData();
  };

  // Filter & Distance calculations
  const currentRegionObj = LAUNCH_REGIONS.find((r) => r.id === selectedRegionId);

  const listingsWithDistance = listings.map((listing) => {
    let distanceKm: number | null = null;
    if (userGeoLocation) {
      distanceKm = getDistanceKm(userGeoLocation.lat, userGeoLocation.lng, listing.lat, listing.lng);
    } else if (currentRegionObj) {
      distanceKm = getDistanceKm(currentRegionObj.center.lat, currentRegionObj.center.lng, listing.lat, listing.lng);
    }
    return { listing, distanceKm };
  });

  const filteredItems = listingsWithDistance.filter(({ listing, distanceKm }) => {
    // Search query filter
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Region & Location filter
    let matchesRegion = true;
    if (selectedRegionId === 'near_me') {
      if (maxDistanceKm && distanceKm !== null) {
        matchesRegion = distanceKm <= maxDistanceKm;
      }
    } else if (selectedRegionId !== 'all') {
      const region = LAUNCH_REGIONS.find(r => r.id === selectedRegionId);
      if (region) {
        const queryLower = region.name.toLowerCase();
        const matchesName = listing.location.toLowerCase().includes(queryLower) ||
          (region.country === 'Nigeria' && listing.location.toLowerCase().includes('lagos')) ||
          (region.country === 'United Kingdom' && listing.location.toLowerCase().includes('london')) ||
          (region.country === 'Germany' && listing.location.toLowerCase().includes('berlin'));
        const matchesProximity = distanceKm !== null && distanceKm <= 60;
        matchesRegion = matchesName || matchesProximity;
      }
    }

    // Explicit distance threshold check
    if (maxDistanceKm !== null && distanceKm !== null && matchesRegion) {
      matchesRegion = distanceKm <= maxDistanceKm;
    }

    // Housing Type & Category filter
    const matchesType = 
      selectedType === 'all' || 
      listing.type === selectedType ||
      (selectedType === 'single-room' && (listing.type === 'room' || listing.type === 'single-room')) ||
      (selectedType === 'self-contained' && (listing.type === 'studio' || listing.type === 'self-contained')) ||
      (selectedType === '1-bedroom-flat' && (listing.type === 'apartment' || listing.type === '1-bedroom-flat'));

    // Price filter
    const matchesPrice = listing.price <= maxPrice;

    // Bedrooms filter
    const matchesBedrooms = 
      minBedrooms === 'all' ||
      (minBedrooms === '0' && listing.bedrooms === 0) ||
      (minBedrooms === '1' && listing.bedrooms === 1) ||
      (minBedrooms === '2' && listing.bedrooms === 2) ||
      (minBedrooms === '3+' && listing.bedrooms >= 3);

    return matchesSearch && matchesRegion && matchesType && matchesPrice && matchesBedrooms;
  });

  // Select a property card & scroll/zoom to it
  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    incrementListingViews(listing.id);
    setMapCenter({ lat: listing.lat, lng: listing.lng });
    setMapZoom(14);
    
    // Smooth scroll into listing element if listed on mobile screen bounds
    const element = document.getElementById(`property-card-${listing.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans select-none antialiased">
      
      {/* PREMIUM HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm/50 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo and Tagline */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('explore')}>
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
              onClick={() => {
                setCurrentTab('explore');
                setSelectedListing(null);
              }}
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
                onClick={() => {
                  setCurrentTab('dashboard');
                  setSelectedListing(null);
                }}
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
              onClick={() => {
                setCurrentTab('bookings');
                setSelectedListing(null);
              }}
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
            {currentUser?.role === 'landlord' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
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
              <div className="absolute right-0 top-full mt-2.5 w-[310px] bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-fade-in">
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
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg flex items-center gap-1 mt-1 truncate">
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

      {/* MOBILE NAVIGATION BAR (STICKY AT BOTTOM FOR ACCESSIBILITY) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 p-2.5 flex justify-around shadow-lg">
        <button
          onClick={() => {
            setCurrentTab('explore');
            setSelectedListing(null);
          }}
          className={`flex flex-col items-center gap-1 font-bold text-xs ${
            currentTab === 'explore' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </button>
        {currentUser?.role === 'landlord' && (
          <button
            onClick={() => {
              setCurrentTab('dashboard');
              setSelectedListing(null);
            }}
            className={`flex flex-col items-center gap-1 font-bold text-xs ${
              currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
        )}
        <button
          onClick={() => {
            setCurrentTab('bookings');
            setSelectedListing(null);
          }}
          className={`flex flex-col items-center gap-1 font-bold text-xs ${
            currentTab === 'bookings' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Bookings</span>
        </button>
        {currentUser?.role === 'landlord' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-1 font-bold text-xs text-slate-400 hover:text-slate-600"
          >
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>List</span>
          </button>
        )}
      </nav>

      {/* CORE VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 mb-20 md:mb-8 overflow-hidden">
        {currentTab === 'explore' ? (
          
          // DUAL-PANE EXPLORE MODE
          <div className="space-y-6">
            
            {/* SEARCH AND FILTERS BAR */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 lg:p-5 space-y-4">
              
              {/* Row 1: Search and Region Selector */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by city, neighborhood, street, metro, or home title..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* GPS Locate Me Button */}
                <button
                  type="button"
                  onClick={handleGetUserLocation}
                  disabled={isLocatingUser}
                  className={`px-3.5 py-2.5 border rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
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
                  <span className="hidden sm:inline">Near Me</span>
                </button>

                {/* Filter Panel Toggle */}
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={`p-2.5 px-4 border rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
                    showFiltersPanel || selectedType !== 'all' || minBedrooms !== 'all' || maxPrice < 2000 || maxDistanceKm !== null
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
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

            {/* DUAL PANE LISTING ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-270px)] min-h-[500px]">
              
              {/* Left Column: Property Feed */}
              <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-baseline mb-3">
                  <h3 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span>
                      {selectedRegionId === 'near_me'
                        ? 'Homes Near Your GPS Location'
                        : selectedRegionId === 'all'
                        ? 'All Active Launch Markets'
                        : `Homes in ${currentRegionObj?.name || selectedRegionId} ${currentRegionObj?.flag || ''}`}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">{filteredItems.length} properties found</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl space-y-2">
                      <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-700 text-sm">No rentals matches your search</h4>
                      <p className="text-xs text-slate-400">Try adjusting your pricing filters, region, or distance radius.</p>
                      <button
                        onClick={() => {
                          setSelectedRegionId('all');
                          setSelectedType('all');
                          setMaxPrice(2000);
                          setSearchQuery('');
                          setMinBedrooms('all');
                          setMaxDistanceKm(null);
                          setUserGeoLocation(null);
                        }}
                        className="mt-3 py-1.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-xl"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredItems.map(({ listing, distanceKm }) => (
                        <PropertyCard
                          key={listing.id}
                          listing={listing}
                          distanceKm={distanceKm}
                          isSelected={selectedListing?.id === listing.id}
                          onClick={() => handleSelectListing(listing)}
                          isFavorited={favorites.includes(listing.id)}
                          onToggleFavorite={(e) => {
                            e.stopPropagation();
                            toggleFavorite(listing.id);
                            setFavorites(getFavorites());
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Map */}
              <div className="lg:col-span-5 h-[400px] lg:h-full shrink-0">
                <PropertyMap
                  listings={filteredItems.map(item => item.listing)}
                  selectedListing={selectedListing}
                  onSelectListing={handleSelectListing}
                  center={mapCenter}
                  zoom={mapZoom}
                />
              </div>

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
        ) : currentTab === 'dashboard' ? (
          <LandlordDashboard
            currentUser={currentUser}
            listings={listings}
            bookings={getBookings()}
            onAddListingClick={() => setShowAddModal(true)}
            onViewBookingClick={() => setCurrentTab('bookings')}
            onViewListingClick={(listing) => {
              setSelectedListing(listing);
              incrementListingViews(listing.id);
            }}
            onRefreshData={refreshData}
            onEditProfileClick={() => setShowEditProfileModal(true)}
          />
        ) : (
          
          // BOOKINGS & OWNER APPROVAL HUB
          <div className="animate-fade-in bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8">
            <BookingsView 
              currentUser={currentUser}
              onStatusChanged={refreshData}
            />
          </div>
        )}
      </main>

      {/* COMPREHENSIVE FOOTER SECTION */}
      <Footer
        onSelectType={(type) => {
          setSelectedType(type);
          setCurrentTab('explore');
        }}
        onOpenAuth={(role) => {
          setAuthModalRole(role);
          setAuthModalMode('signup');
          setShowAuthModal(true);
        }}
        onListPropertyClick={() => setShowAddModal(true)}
      />

      {/* POPUP: PROPERTY DETAIL DRAWER MODAL */}
      {selectedListing && (
        <PropertyDetails
          listing={selectedListing}
          currentUser={currentUser}
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
        />
      )}

      {/* POPUP: ADD LISTING STEPPER MODAL */}
      {showAddModal && (
        <AddListingModal
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

      {/* POPUP: COMPREHENSIVE SIGN UP & AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole={authModalRole}
        initialMode={authModalMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
        }}
      />

    </div>
  );
}
