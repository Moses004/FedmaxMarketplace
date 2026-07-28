import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/store';
import { 
  GLOBAL_COUNTRIES, CountryData, searchCountries, 
  getDynamicMarketsForCountry, searchAddressSuggestions, GeocodedAddress 
} from '../utils/location';
import { 
  X, User as UserIcon, Building, Mail, Phone, MapPin, 
  Globe, ShieldCheck, Check, Sparkles, FileText, Lock, ArrowRight, Compass,
  Search, ChevronDown, RefreshCw, Save, AlertCircle
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveSuccess: (updatedUser: User) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSaveSuccess
}: EditProfileModalProps) {
  if (!isOpen || !currentUser) return null;

  // Form fields initialized with currentUser
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [role, setRole] = useState<'guest' | 'landlord'>(currentUser.role || 'guest');
  
  // Phone parsing
  const initialPhone = currentUser.phone || '';
  const initialPhoneParts = initialPhone.split(' ');
  const defaultPhoneCode = initialPhoneParts.length > 1 && initialPhoneParts[0].startsWith('+') ? initialPhoneParts[0] : '+34';
  const defaultPhoneNum = initialPhoneParts.length > 1 ? initialPhoneParts.slice(1).join(' ') : initialPhone;

  const [phoneCode, setPhoneCode] = useState(defaultPhoneCode);
  const [phone, setPhone] = useState(defaultPhoneNum);

  // Match country object
  const matchedCountry = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === (currentUser.country || 'Spain').toLowerCase()) || GLOBAL_COUNTRIES[0];
  const [selectedCountryObj, setSelectedCountryObj] = useState<CountryData>(matchedCountry);
  const [country, setCountry] = useState(currentUser.country || 'Spain');
  const [stateRegion, setStateRegion] = useState(currentUser.state || 'Community of Madrid');
  const [city, setCity] = useState(currentUser.city || 'Madrid');
  const [postalCode, setPostalCode] = useState(currentUser.postalCode || '');
  const [streetAddress, setStreetAddress] = useState(currentUser.streetAddress || '');

  // Role specific fields
  const [taxId, setTaxId] = useState(currentUser.taxId || '');
  const [preferredMoveInRegion, setPreferredMoveInRegion] = useState(currentUser.preferredMoveInRegion || 'Madrid, Spain');
  const [marketSearchInput, setMarketSearchInput] = useState(currentUser.preferredMoveInRegion || 'Madrid, Spain');

  // Country Dropdown state
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchFilter, setCountrySearchFilter] = useState('');

  // Market Search Dropdown state
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [geocodedMarketResults, setGeocodedMarketResults] = useState<GeocodedAddress[]>([]);
  const [isSearchingMarket, setIsSearchingMarket] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const marketDropdownRef = useRef<HTMLDivElement>(null);

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

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setRole(currentUser.role || 'guest');
      setCountry(currentUser.country || 'Spain');
      setStateRegion(currentUser.state || '');
      setCity(currentUser.city || '');
      setPostalCode(currentUser.postalCode || '');
      setStreetAddress(currentUser.streetAddress || '');
      setTaxId(currentUser.taxId || '');
      setPreferredMoveInRegion(currentUser.preferredMoveInRegion || 'Madrid, Spain');
      setMarketSearchInput(currentUser.preferredMoveInRegion || 'Madrid, Spain');
    }
  }, [currentUser]);

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

  const handleSelectCountry = (countryObj: CountryData) => {
    setSelectedCountryObj(countryObj);
    setCountry(countryObj.name);
    setPhoneCode(countryObj.phoneCode);
    setShowCountryDropdown(false);
    setCountrySearchFilter('');

    if (countryObj.majorStates.length > 0 && !stateRegion) {
      setStateRegion(countryObj.majorStates[0]);
    }
    if (countryObj.popularCities.length > 0 && !city) {
      setCity(countryObj.popularCities[0]);
    }
  };

  const filteredCountries = searchCountries(countrySearchFilter);
  const dynamicMarkets = getDynamicMarketsForCountry(country);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMsg('Valid email address is required.');
      return;
    }

    setIsSubmitting(true);
    const fullPhone = phone.trim() ? `${phoneCode} ${phone.trim()}` : '';

    setTimeout(() => {
      const updated = updateUserProfile({
        id: currentUser.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        phone: fullPhone,
        country: country.trim(),
        state: stateRegion.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        streetAddress: streetAddress.trim(),
        taxId: role === 'landlord' ? taxId.trim() : currentUser.taxId,
        preferredMoveInRegion: role === 'guest' ? preferredMoveInRegion : currentUser.preferredMoveInRegion,
      });

      setIsSubmitting(false);
      setSuccessMsg('Profile updated successfully!');
      onSaveSuccess(updated);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 800);
    }, 400);
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
              <UserIcon className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Profile Management
            </span>
          </div>

          <h2 className="text-xl font-display font-black text-white">
            Edit &amp; Update Profile
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Update your personal contact details, verified address, location preferences, or landlord payout details.
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Account Type / Role Switcher */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Account Role / Type
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
                  <span className="text-[10px] text-slate-500 block leading-tight">Searching and booking rentals</span>
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
                  <span className="text-[10px] text-slate-500 block leading-tight">Listing properties &amp; receiving payouts</span>
                </div>
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Personal &amp; Contact Info</span>
            </h4>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Full Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

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
                    placeholder="Phone number"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Address */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Location &amp; Postal Address</span>
            </h4>

            {/* Country Selector */}
            <div ref={countryDropdownRef} className="relative">
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Country of Residence
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

              {showCountryDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={countrySearchFilter}
                      onChange={(e) => setCountrySearchFilter(e.target.value)}
                      placeholder="Search country..."
                      className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none placeholder-slate-400"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {filteredCountries.map((c) => (
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
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* State & City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">State / Region / Province</label>
                <input
                  type="text"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  placeholder="e.g. Madrid or Lagos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">City / Town</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Madrid or London"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Postal Code & Street Address */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 28013"
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

          {/* Tenant specific: Preferred Move-In Region */}
          {role === 'guest' && (
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Target Search Market</span>
                </div>
              </div>
              <div ref={marketDropdownRef} className="relative">
                <input
                  type="text"
                  value={marketSearchInput}
                  onChange={(e) => {
                    setMarketSearchInput(e.target.value);
                    setPreferredMoveInRegion(e.target.value);
                    setShowMarketDropdown(true);
                  }}
                  onFocus={() => setShowMarketDropdown(true)}
                  placeholder="Search target rental city/market..."
                  className="w-full pl-9 pr-9 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          {/* Landlord specific: Tax ID */}
          {role === 'landlord' && (
            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Landlord Tax ID / NIF / NIE</span>
              </div>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Tax ID (e.g. ES-12345678Z)"
                className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
