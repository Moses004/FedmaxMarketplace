import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Check, AlertCircle, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { User } from '../types';
import { updateProfile } from '../services/profileService';
import { 
  GLOBAL_COUNTRIES, 
  getStatesForCountry, 
  getCitiesForState, 
  deriveRegionFromLocation 
} from '../utils/location';
import { useToast } from '../context/ToastContext';

interface LocationOnboardingModalProps {
  currentUser: User;
  onLocationSaved: (updatedUser: User) => void;
  canDismiss?: boolean;
  onClose?: () => void;
}

export default function LocationOnboardingModal({
  currentUser,
  onLocationSaved,
  canDismiss = false,
  onClose
}: LocationOnboardingModalProps) {
  const toast = useToast();

  const [country, setCountry] = useState<string>(currentUser.country || 'Nigeria');
  const [state, setState] = useState<string>(currentUser.state || 'Lagos State');
  const [city, setCity] = useState<string>(currentUser.city || 'Lagos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for selected country
  const availableStates = getStatesForCountry(country);
  const availableCities = getCitiesForState(country, state);

  // Derived Geopolitical Zone / Region
  const derivedRegion = deriveRegionFromLocation({ country, state, city });

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const newStates = getStatesForCountry(newCountry);
    const firstState = newStates.length > 0 ? newStates[0] : '';
    setState(firstState);
    const newCities = getCitiesForState(newCountry, firstState);
    setCity(newCities.length > 0 ? newCities[0] : '');
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    const newCities = getCitiesForState(country, newState);
    setCity(newCities.length > 0 ? newCities[0] : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim() || !state.trim() || !city.trim()) {
      setErrorMsg('Please select your Country, State/Province, and City to complete your location setup.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const region = deriveRegionFromLocation({ country, state, city });
      const updated = await updateProfile(currentUser.id, {
        country: country.trim(),
        state: state.trim(),
        city: city.trim(),
        region: region.trim(),
      });

      toast.success(
        'Location Saved to Database',
        `Showing verified properties in ${city}, ${state} (${region}).`
      );

      setIsSubmitting(false);
      onLocationSaved(updated);
    } catch (err: any) {
      console.error('Failed to save user location to Supabase:', err);
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Database error: Failed to save location preferences.');
    }
  };

  return (
    <div 
      id="location-onboarding-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
      >
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Set Your Location Scope
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-neutral-400">
              Rentora tailors available property listings to your verified geographic region.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {GLOBAL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} className="bg-neutral-900 text-white">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* State / Province */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              State / Province / Region
            </label>
            {availableStates.length > 0 ? (
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st} className="bg-neutral-900 text-white">
                    {st}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter State or Province"
                className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            )}
          </div>

          {/* City / Town */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              City / Town
            </label>
            {availableCities.length > 0 ? (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {availableCities.map((ct) => (
                  <option key={ct} value={ct} className="bg-neutral-900 text-white">
                    {ct}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City or Town"
                className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            )}
          </div>

          {/* Derived Geopolitical Zone Badge */}
          {derivedRegion && (
            <div className="p-3 bg-neutral-800/60 border border-neutral-700/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Geopolitical Zone:</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {derivedRegion}
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            {canDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving to Database...</span>
              ) : (
                <>
                  <span>Save Location & View Properties</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
