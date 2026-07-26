import React, { useState, useEffect } from 'react';
import { Listing, User } from './types';
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
import { 
  Building, Search, MapPin, Euro, Compass, Calendar, 
  User as UserIcon, Plus, Filter, RefreshCw, Sparkles, SlidersHorizontal, ChevronRight, LogOut, Check,
  BarChart3
} from 'lucide-react';

export default function App() {
  // Core App Views
  const [currentTab, setCurrentTab] = useState<'explore' | 'bookings' | 'dashboard'>('explore');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'madrid' | 'barcelona'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'room' | 'studio' | 'apartment'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [minBedrooms, setMinBedrooms] = useState<string>('all');

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authRole, setAuthRole] = useState<'guest' | 'landlord'>('guest');
  const [authName, setAuthName] = useState('');
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);

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

  // Update map center when city changes
  useEffect(() => {
    if (selectedCity === 'madrid') {
      setMapCenter({ lat: 40.4167, lng: -3.7037 });
      setMapZoom(13);
    } else if (selectedCity === 'barcelona') {
      setMapCenter({ lat: 41.3851, lng: 2.1734 });
      setMapZoom(13);
    }
  }, [selectedCity]);

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

  // Filter calculations
  const filteredListings = listings.filter((listing) => {
    // Search query filter
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());

    // City filter
    const matchesCity = 
      selectedCity === 'all' || 
      listing.location.toLowerCase().includes(selectedCity);

    // Housing Type filter
    const matchesType = 
      selectedType === 'all' || 
      listing.type === selectedType;

    // Price filter
    const matchesPrice = listing.price <= maxPrice;

    // Bedrooms filter
    const matchesBedrooms = 
      minBedrooms === 'all' ||
      (minBedrooms === '0' && listing.bedrooms === 0) ||
      (minBedrooms === '1' && listing.bedrooms === 1) ||
      (minBedrooms === '2' && listing.bedrooms === 2) ||
      (minBedrooms === '3+' && listing.bedrooms >= 3);

    return matchesSearch && matchesCity && matchesType && matchesPrice && matchesBedrooms;
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
              <span className="font-display font-black text-xl tracking-tight text-slate-800">Fedmax</span>
              <span className="text-[10px] text-emerald-600 font-bold block -mt-1 uppercase tracking-wider">Marketplace</span>
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
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 p-1.5 pr-3.5 rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                {currentUser?.name ? currentUser.name.slice(0, 2) : 'G'}
              </div>
              <div className="hidden lg:block">
                <span className="font-bold text-slate-700 text-xs block leading-tight">
                  {currentUser?.name || 'Guest User'}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium -mt-0.5">
                  Identity: {currentUser?.role === 'landlord' ? 'Landlord' : 'Tenant'}
                </span>
              </div>
            </button>

            {/* Auth Identity Dropdown Panel */}
            {showAuthDropdown && (
              <div className="absolute right-0 top-full mt-2.5 w-[280px] bg-white border border-slate-100 rounded-2xl shadow-xl p-4 space-y-4 z-50">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Testing Identities</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Fedmax supports separate guest and landlord states. Choose an identity to test booking submissions & owner approvals!
                  </p>
                </div>

                {/* Preset Profiles */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Preset Profile</span>
                  
                  {/* Guest Profile */}
                  <button
                    onClick={() => handleQuickLogin('mosesarchibong004@gmail.com', 'guest', 'Moses Archibong')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                      currentUser?.email === 'mosesarchibong004@gmail.com' && currentUser.role === 'guest'
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-700 text-xs block">Moses Archibong (Tenant)</span>
                      <span className="text-[10px] text-slate-400 block">mosesarchibong004@gmail.com</span>
                    </div>
                    {currentUser?.email === 'mosesarchibong004@gmail.com' && currentUser.role === 'guest' && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  {/* Landlord Profile */}
                  <button
                    onClick={() => handleQuickLogin('landlord@fedmax.com', 'landlord', 'Carlos Silva')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                      currentUser?.email === 'landlord@fedmax.com' && currentUser.role === 'landlord'
                        ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300'
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-700 text-xs block">Carlos Silva (Landlord)</span>
                      <span className="text-[10px] text-slate-400 block">landlord@fedmax.com</span>
                    </div>
                    {currentUser?.email === 'landlord@fedmax.com' && currentUser.role === 'landlord' && (
                      <Check className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                </div>

                {/* Custom Sign-in Form */}
                <form onSubmit={handleCustomLogin} className="border-t border-slate-100 pt-3 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Custom Login</span>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAuthRole('guest')}
                      className={`py-1 rounded font-bold text-[10px] border transition-all ${
                        authRole === 'guest'
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      As Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('landlord')}
                      className={`py-1 rounded font-bold text-[10px] border transition-all ${
                        authRole === 'landlord'
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      As Landlord
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Authenticate
                  </button>
                </form>

                {/* Sign Out */}
                <button
                  onClick={handleLogout}
                  className="w-full py-2 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-dashed border-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out State</span>
                </button>
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
              
              {/* Row 1: Search and City Toggle */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by neighborhood, street, metro, or home name..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* City filters */}
                <div className="flex bg-slate-100/80 p-1 rounded-2xl shrink-0">
                  <button
                    onClick={() => setSelectedCity('all')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCity === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    All Spain
                  </button>
                  <button
                    onClick={() => setSelectedCity('madrid')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCity === 'madrid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Madrid
                  </button>
                  <button
                    onClick={() => setSelectedCity('barcelona')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCity === 'barcelona' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Barcelona
                  </button>
                </div>

                {/* Filter Panel Toggle */}
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={`p-2.5 px-4 border rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors ${
                    showFiltersPanel || selectedType !== 'all' || minBedrooms !== 'all' || maxPrice < 2000
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Row 2: Secondary Filters Drawer Panel */}
              {(showFiltersPanel || selectedType !== 'all' || minBedrooms !== 'all' || maxPrice < 2000) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3.5 border-t border-slate-50 animate-fade-in">
                  
                  {/* Filter Property Type */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Housing Type</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(['all', 'room', 'studio', 'apartment'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedType(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize transition-all ${
                            selectedType === t
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          {t === 'all' ? 'All categories' : t}
                        </button>
                      ))}
                    </div>
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
                  <h3 className="font-display font-black text-slate-800 text-lg">
                    Homes in {selectedCity === 'all' ? 'Spain' : selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">{filteredListings.length} properties found</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  {filteredListings.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl space-y-2">
                      <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-700 text-sm">No rentals matches your search</h4>
                      <p className="text-xs text-slate-400">Try adjusting your pricing filters, location query, or category criteria.</p>
                      <button
                        onClick={() => {
                          setSelectedCity('all');
                          setSelectedType('all');
                          setMaxPrice(2000);
                          setSearchQuery('');
                          setMinBedrooms('all');
                        }}
                        className="mt-3 py-1.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-xl"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredListings.map((listing) => (
                        <PropertyCard
                          key={listing.id}
                          listing={listing}
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
                  listings={filteredListings}
                  selectedListing={selectedListing}
                  onSelectListing={handleSelectListing}
                  center={mapCenter}
                  zoom={mapZoom}
                />
              </div>

            </div>

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
            handleQuickLogin('mosesarchibong004@gmail.com', 'guest', 'Moses Archibong');
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

    </div>
  );
}
