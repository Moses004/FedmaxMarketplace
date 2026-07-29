import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { registerUser, login } from '../services/store';
import { 
  GLOBAL_COUNTRIES, CountryData, searchCountries, 
  getDynamicMarketsForCountry, searchAddressSuggestions, GeocodedAddress, LAUNCH_REGIONS,
  getStatesForCountry, getCitiesForState
} from '../utils/location';
import { 
  X, User as UserIcon, Building, Mail, Phone, MapPin, 
  Globe, ShieldCheck, Check, Sparkles, FileText, Lock, ArrowRight, Compass,
  Search, ChevronDown, RefreshCw
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialRole?: 'guest' | 'landlord';
  initialMode?: 'signup' | 'login';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'guest',
  initialMode = 'signup'
}: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [role, setRole] = useState<'guest' | 'landlord'>(initialRole);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+34');
  const [phone, setPhone] = useState('');
  
  // Location fields (Required in sign up)
  const [selectedCountryObj, setSelectedCountryObj] = useState<CountryData>(GLOBAL_COUNTRIES[0]); // Spain default
  const [country, setCountry] = useState('Spain');
  const [stateRegion, setStateRegion] = useState('Community of Madrid');
  const [city, setCity] = useState('Madrid');
  const [postalCode, setPostalCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  // Country Search Dropdown State
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchFilter, setCountrySearchFilter] = useState('');

  // Target Search Market State
  const [preferredMoveInRegion, setPreferredMoveInRegion] = useState('Madrid, Spain');
  const [marketSearchInput, setMarketSearchInput] = useState('Madrid, Spain');
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [geocodedMarketResults, setGeocodedMarketResults] = useState<GeocodedAddress[]>([]);
  const [isSearchingMarket, setIsSearchingMarket] = useState(false);

  // Role specific fields
  const [taxId, setTaxId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const marketDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(event.target as Node)) {
        setShowMarketDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update country selection and sync phone code & default markets
  const handleSelectCountry = (countryObj: CountryData) => {
    setSelectedCountryObj(countryObj);
    setCountry(countryObj.name);
    setPhoneCode(countryObj.phoneCode);
    setShowCountryDropdown(false);
    setCountrySearchFilter('');

    // Auto update recommended state & city if empty or matching previous country defaults
    if (countryObj.majorStates.length > 0) {
      setStateRegion(countryObj.majorStates[0]);
    }
    if (countryObj.popularCities.length > 0) {
      setCity(countryObj.popularCities[0]);
      // Update target search market to top city of selected country
      const topMarket = `${countryObj.popularCities[0]}, ${countryObj.name}`;
      setPreferredMoveInRegion(topMarket);
      setMarketSearchInput(topMarket);
    }
  };

  // Live Geocoding search for Target Search Market
  useEffect(() => {
    if (!marketSearchInput || marketSearchInput.trim().length < 2) {
      setGeocodedMarketResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMarket(true);
      const results = await searchAddressSuggestions(marketSearchInput);
      setGeocodedMarketResults(results);
      setIsSearchingMarket(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [marketSearchInput]);

  if (!isOpen) return null;

  const filteredCountries = searchCountries(countrySearchFilter);
  const dynamicMarkets = getDynamicMarketsForCountry(country);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Full name is required.');
        return;
      }
      if (!country) {
        setErrorMsg('Country is required.');
        return;
      }
      if (!stateRegion.trim()) {
        setErrorMsg('State/Province is required.');
        return;
      }
      if (!city.trim()) {
        setErrorMsg('City is required.');
        return;
      }
      if (!postalCode.trim()) {
        setErrorMsg('Postal code is required.');
        return;
      }

      setIsSubmitting(true);
      const fullPhone = phone ? `${phoneCode} ${phone.trim()}` : '';

      setTimeout(() => {
        const newUser = registerUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          phone: fullPhone,
          country,
          state: stateRegion.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          streetAddress: streetAddress.trim(),
          taxId: role === 'landlord' ? taxId.trim() : undefined,
          preferredMoveInRegion: role === 'guest' ? preferredMoveInRegion : undefined,
        });

        setIsSubmitting(false);
        onSuccess(newUser);
        onClose();
      }, 400);
    } else {
      // Login mode
      setIsSubmitting(true);
      setTimeout(() => {
        const user = login(email.trim().toLowerCase(), role, name.trim() || undefined);
        setIsSubmitting(false);
        onSuccess(user);
        onClose();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl my-8 overflow-hidden relative">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
              {role === 'landlord' ? <Building className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {mode === 'signup' ? 'New Account Registration' : 'Welcome Back'}
            </span>
          </div>

          <h2 className="text-xl font-display font-black text-white">
            {mode === 'signup' 
              ? `Sign up as a ${role === 'landlord' ? 'Landlord / Owner' : 'Tenant / Guest'}`
              : 'Sign in to your Rentora account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {mode === 'signup'
              ? 'Complete your profile details, phone number, and verified location address.'
              : 'Access your property dashboard, bookings, or saved favorites.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-2xl mt-4 border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign Up (New User)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role Choice Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Account Type / Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('guest')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  role === 'guest'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${role === 'guest' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Tenant / Guest</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">Book long-term rooms & apartments</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('landlord')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  role === 'landlord'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${role === 'landlord' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Landlord / Owner</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">List properties & collect payouts</span>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Personal Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Personal Information</span>
            </h4>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Moses Archibong or Carlos Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 flex items-center gap-1 shrink-0">
                    <span>{selectedCountryObj.flag}</span>
                    <span>{phoneCode}</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 612 345 678"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location & Address Information (REQUIRED for Sign Up) */}
          {mode === 'signup' && (
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Location & Postal Address</span>
                </h4>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Dynamic Location Lookup
                </span>
              </div>

              {/* DYNAMIC COUNTRY SEARCHABLE SELECTOR */}
              <div ref={countryDropdownRef} className="relative">
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Country of Residence <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-emerald-500 focus:bg-white rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedCountryObj.flag}</span>
                    <span>{country}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({selectedCountryObj.phoneCode})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Quick Popular Country Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {GLOBAL_COUNTRIES.slice(0, 5).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        country === c.name 
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>

                {/* Country Searchable Dropdown Popup */}
                {showCountryDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        value={countrySearchFilter}
                        onChange={(e) => setCountrySearchFilter(e.target.value)}
                        placeholder="Search country name or code..."
                        className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none placeholder-slate-400"
                      />
                      {countrySearchFilter && (
                        <button
                          type="button"
                          onClick={() => setCountrySearchFilter('')}
                          className="text-[10px] text-slate-400 hover:text-slate-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                      {filteredCountries.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No matching countries found
                        </div>
                      ) : (
                        filteredCountries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleSelectCountry(c)}
                            className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs hover:bg-emerald-50/50 transition-colors cursor-pointer ${
                              country === c.name ? 'bg-emerald-50 text-emerald-900 font-extrabold' : 'text-slate-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span>{c.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">{c.phoneCode}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* State & City Inputs with Dynamic Suggestion Chips */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    State / Region / Province <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="e.g. Madrid, Lagos, Catalonia"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {/* Dynamic State Chips */}
                  {(() => {
                    const states = getStatesForCountry(country);
                    if (states.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {states.slice(0, 4).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setStateRegion(st);
                              const cities = getCitiesForState(country, st);
                              if (cities.length > 0) {
                                setCity(cities[0]);
                              }
                            }}
                            className="text-[9.5px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold cursor-pointer transition-colors"
                          >
                            + {st}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    City / District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Madrid, Lekki, London"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {/* Dynamic City Chips derived from state selection */}
                  {(() => {
                    const cities = getCitiesForState(country, stateRegion);
                    if (cities.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cities.slice(0, 4).map((ct) => (
                          <button
                            key={ct}
                            type="button"
                            onClick={() => {
                              setCity(ct);
                              setPreferredMoveInRegion(`${ct}, ${country}`);
                              setMarketSearchInput(`${ct}, ${country}`);
                            }}
                            className="text-[9.5px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold cursor-pointer transition-colors"
                          >
                            + {ct}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Postal Code & Street Address Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Postal Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 28013 or 100001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Street Address</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. Calle Mayor, 12, Apt 3B"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC TARGET SEARCH MARKET FIELD */}
          {mode === 'signup' && role === 'guest' && (
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Target Search Market</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Dynamic Market Search
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Which market or city are you searching long-term accommodation in? (Dynamically populates rental matches).
              </p>

              {/* Searchable Combobox for Target Market */}
              <div ref={marketDropdownRef} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={marketSearchInput}
                    onChange={(e) => {
                      setMarketSearchInput(e.target.value);
                      setPreferredMoveInRegion(e.target.value);
                      setShowMarketDropdown(true);
                    }}
                    onFocus={() => setShowMarketDropdown(true)}
                    placeholder="Search city, market or enter region name..."
                    className="w-full pl-9 pr-9 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  {isSearchingMarket && (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin absolute right-3 top-2.5" />
                  )}
                </div>

                {/* Quick Dynamic Market Pills for selected country & launch hubs */}
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {dynamicMarkets.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setPreferredMoveInRegion(m.value);
                        setMarketSearchInput(m.value);
                        setShowMarketDropdown(false);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                        preferredMoveInRegion === m.value
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50'
                      }`}
                    >
                      <span>{m.flag} {m.label}</span>
                      {m.isLaunchRegion && (
                        <span className="ml-1 text-[8px] bg-emerald-200 text-emerald-900 px-1 rounded-xs">
                          HOT
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Autocomplete Results Popup */}
                {showMarketDropdown && (geocodedMarketResults.length > 0 || dynamicMarkets.length > 0) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto animate-fade-in">
                    
                    {/* Live Geocoded City Match Results */}
                    {geocodedMarketResults.length > 0 && (
                      <div className="p-1 border-b border-slate-100">
                        <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wide px-2 py-1 block">
                          Global City Matches
                        </span>
                        {geocodedMarketResults.map((res, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const val = `${res.city}, ${res.country || country}`;
                              setPreferredMoveInRegion(val);
                              setMarketSearchInput(val);
                              setShowMarketDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer"
                          >
                            <span className="truncate">{res.formattedAddress}</span>
                            <span className="text-[10px] text-emerald-600 font-bold shrink-0 ml-2">Select</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Launch Markets */}
                    <div className="p-1">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wide px-2 py-1 block">
                        Launch Regions & Hubs
                      </span>
                      {dynamicMarkets.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => {
                            setPreferredMoveInRegion(m.value);
                            setMarketSearchInput(m.value);
                            setShowMarketDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <span>{m.flag}</span>
                          <span className="flex-1">{m.label}</span>
                          {m.isLaunchRegion && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">
                              Verified Market
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Role-Specific Recommended Onboarding Fields */}
          {mode === 'signup' && role === 'landlord' && (
            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Landlord Verification & Payout Tax ID</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Provide your Tax Identification Number (NIF / NIE in Spain, SSN / EIN in US, or NIN / Tax ID) for automated rental invoice generation and Payout compliance.
              </p>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Tax ID / NIF / NIE (e.g. ES-12345678Z)"
                className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : mode === 'signup' ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create {role === 'landlord' ? 'Landlord' : 'Tenant'} Account</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Log In to Rentora</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-normal">
            By registering, you agree to Rentora RealEstate Rental Verification terms, privacy policies, and verified tenant/owner guidelines.
          </p>
        </form>

      </div>
    </div>
  );
}

