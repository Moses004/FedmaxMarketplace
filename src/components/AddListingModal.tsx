import React, { useState, useRef, useEffect } from 'react';
import { createListing } from '../services/store';
import { Listing, PropertyType, PROPERTY_CATEGORY_OPTIONS } from '../types';
import { X, Check, ArrowRight, ArrowLeft, Plus, Image, Eye, HelpCircle, Upload, Trash2, FolderPlus, Sparkles, AlertCircle, RefreshCw, Wand2, MapPin, Search, ShieldAlert } from 'lucide-react';
import { searchAddressSuggestions, GeocodedAddress, GLOBAL_COUNTRIES, getStatesForCountry, getCitiesForState, getAreasForCity } from '../utils/location';
import { validateStep1, validateStep2, validateListingFull } from '../schemas/listingSchema';

interface AddListingModalProps {
  onClose: () => void;
  onListingCreated: () => void;
}

const PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', label: 'Premium Bedroom' },
  { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', label: 'Modern Studio Loft' },
  { url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80', label: 'Luxury Penthouse Room' },
  { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80', label: 'Cozy Living Room' },
  { url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80', label: 'Scandinavian Bedroom' },
  { url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80', label: 'Vintage Apartment' }
];

const PRESET_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Smart TV',
  'Private Balcony',
  'Private Terrace',
  'Rooftop Access',
  'Double Bed',
  'Private Kitchenette',
  'Fully Equipped Kitchen',
  'Rainfall Shower'
];

export default function AddListingModal({ onClose, onListingCreated }: AddListingModalProps) {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('Nigeria');
  const [stateName, setStateName] = useState('Lagos State');
  const [cityName, setCityName] = useState('Lagos');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(700);
  const [type, setType] = useState<PropertyType>('single-room');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [size, setSize] = useState(25);
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImage, setCustomImage] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<{ id: string; url: string; fileName: string; sizeKb: number; source: 'device' | 'preset' }[]>([
    { id: 'preset-1', url: PRESET_IMAGES[0].url, fileName: 'Preset_Bedroom.jpg', sizeKb: 340, source: 'preset' }
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['High-Speed Wi-Fi', 'Double Bed']);
  const [annualDiscountPercentage, setAnnualDiscountPercentage] = useState(10);
  const [customLat, setCustomLat] = useState<number | null>(null);
  const [customLng, setCustomLng] = useState<number | null>(null);
  const [modalCountry, setModalCountry] = useState<string>('Spain');
  const [modalState, setModalState] = useState<string>('all');
  const [modalCity, setModalCity] = useState<string>('all');
  const [modalArea, setModalArea] = useState<string>('all');
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodedAddress[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);
  
  // Schema validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string | null>(null);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
    if (validationSummary) {
      setValidationSummary(null);
    }
  };

  // Device photo file upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process files from device or computer
  const handleProcessDeviceFiles = (files: FileList | File[]) => {
    setUploadError(null);
    clearFieldError('images');
    const validImageFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size > 15 * 1024 * 1024) {
          setUploadError('One or more files exceed the 15MB size limit.');
        } else {
          validImageFiles.push(file);
        }
      } else {
        setUploadError('Please select valid image files (JPG, PNG, WEBP).');
      }
    });

    if (validImageFiles.length === 0) return;

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        if (resultUrl) {
          const newPhoto = {
            id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: resultUrl,
            fileName: file.name,
            sizeKb: Math.round(file.size / 1024),
            source: 'device' as const
          };
          setUploadedPhotos(prev => [newPhoto, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessDeviceFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessDeviceFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSetCoverPhoto = (index: number) => {
    setUploadedPhotos(prev => {
      const copy = [...prev];
      const target = copy.splice(index, 1)[0];
      return [target, ...copy];
    });
  };

  // Toggle amenities selection
  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  // AI Enhance description using Gemini API
  const handleAIEnhance = async () => {
    setIsEnhancing(true);
    setEnhanceSuccess(false);

    try {
      const response = await fetch('/api/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          location,
          price,
          size,
          bedrooms,
          bathrooms,
          amenities: selectedAmenities,
        })
      });

      if (!response.ok) throw new Error('API Request failed');
      const data = await response.json();

      if (data.enhancedDescription) {
        setDescription(data.enhancedDescription);
        setEnhanceSuccess(true);
        setTimeout(() => setEnhanceSuccess(false), 3500);
      } else {
        throw new Error('No description generated');
      }
    } catch (err) {
      console.warn("Gemini Enhance Error, applying intelligent fallback copywriting:", err);
      const categoryLabel = PROPERTY_CATEGORY_OPTIONS.find(c => c.id === type)?.label || type;
      const amenityText = selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'modern amenities';
      const loc = location || 'a prime neighborhood in Madrid';
      
      const fallbackDesc = `Discover this outstanding ${categoryLabel.toLowerCase()} located in ${loc}. Beautifully styled and tailored for modern living, this ${size} m² home features ${bedrooms > 0 ? `${bedrooms} comfortable bedroom${bedrooms > 1 ? 's' : ''}` : 'an open studio layout'} and ${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}, offering an exceptional balance of style and privacy.\n\nEnjoy premium features and conveniences including ${amenityText}. Conveniently situated near vibrant dining options, public transit stops, and essential shops, this property provides everything needed for a seamless urban lifestyle at €${price}/month.`;

      setDescription(fallbackDesc);
      setEnhanceSuccess(true);
      setTimeout(() => setEnhanceSuccess(false), 3500);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle Step transitions with Step-level schema validation
  const handleNextStep = () => {
    if (step === 1) {
      const v1 = validateStep1({
        type,
        title,
        location,
        price,
        size,
        annualDiscountPercentage,
      });
      if (!v1.isValid) {
        setFieldErrors(v1.errors);
        setValidationSummary('Please resolve the highlighted required fields before continuing to Step 2.');
        return;
      }
    } else if (step === 2) {
      const finalImagesList: string[] = [];
      if (uploadedPhotos.length > 0) {
        uploadedPhotos.forEach(p => finalImagesList.push(p.url));
      }
      if (customImage && !finalImagesList.includes(customImage)) {
        finalImagesList.unshift(customImage);
      }
      if (finalImagesList.length === 0 && selectedImage) {
        finalImagesList.push(selectedImage);
      }

      const v2 = validateStep2({
        bedrooms,
        bathrooms,
        images: finalImagesList,
      });
      if (!v2.isValid) {
        setFieldErrors(v2.errors);
        setValidationSummary('At least 1 property photo is required before continuing to Step 3.');
        return;
      }
    }

    setFieldErrors({});
    setValidationSummary(null);
    setStep(s => s + 1);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Collect all photo URLs from uploaded device photos, custom input or presets
    const finalImagesList: string[] = [];
    if (uploadedPhotos.length > 0) {
      uploadedPhotos.forEach(p => finalImagesList.push(p.url));
    }
    if (customImage && !finalImagesList.includes(customImage)) {
      finalImagesList.unshift(customImage);
    }
    if (finalImagesList.length === 0 && selectedImage) {
      finalImagesList.push(selectedImage);
    }

    // Full Schema Validation
    const validation = validateListingFull({
      type,
      title,
      location,
      price,
      size,
      annualDiscountPercentage,
      bedrooms,
      bathrooms,
      images: finalImagesList,
      description,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      if (validation.firstInvalidStep && validation.firstInvalidStep !== step) {
        setStep(validation.firstInvalidStep);
        setValidationSummary(`Incomplete or invalid fields in Step ${validation.firstInvalidStep}. Please check the highlighted inputs.`);
      } else {
        setValidationSummary('Please fix the highlighted errors before publishing your property listing.');
      }
      return;
    }

    setValidationSummary(null);
    setFieldErrors({});
    setIsSubmitting(true);

    // Use geocoded custom coordinates if set, or seed realistic coordinates near Madrid
    let lat = customLat;
    let lng = customLng;
    if (lat === null || lng === null) {
      const randomOffsetLat = (Math.random() - 0.5) * 0.04;
      const randomOffsetLng = (Math.random() - 0.5) * 0.05;
      lat = 40.4167 + randomOffsetLat;
      lng = -3.7037 + randomOffsetLng;
    }

    setTimeout(() => {
      createListing({
        title: title.trim(),
        description: description.trim(),
        price,
        annualDiscountPercentage,
        type,
        location: location.trim(),
        country,
        state: stateName,
        city: cityName,
        lat,
        lng,
        bedrooms,
        bathrooms,
        size,
        amenities: selectedAmenities,
        images: finalImagesList,
        availableFrom: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 days in future
      });

      setIsSubmitting(false);
      onListingCreated();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">List Your Property</h3>
            <p className="text-xs text-slate-400">Step {step} of 3 • Add details about your rental home</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {validationSummary && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">
                <span className="font-bold block text-rose-900">Validation Notice</span>
                <span>{validationSummary}</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Real Estate Property Category Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Property Category *</label>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    {PROPERTY_CATEGORY_OPTIONS.find(c => c.id === type)?.label}
                  </span>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 p-1 bg-slate-50 border rounded-2xl ${fieldErrors.type ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'}`}>
                  {PROPERTY_CATEGORY_OPTIONS.map(cat => {
                    const isSelected = type === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setType(cat.id);
                          clearFieldError('type');
                          // Smart default bedroom assignment based on selected category
                          if (cat.id === 'self-contained' || cat.id === 'office-commercial' || cat.id === 'studio') {
                            setBedrooms(0);
                          } else if (cat.id === 'single-room' || cat.id === '1-bedroom-flat' || cat.id === 'shared-apartment' || cat.id === 'room') {
                            setBedrooms(1);
                          } else if (cat.id === '2-bedroom-flat' || cat.id === 'duplex') {
                            setBedrooms(2);
                          } else if (cat.id === '3plus-bedroom-flat' || cat.id === 'penthouse' || cat.id === 'bungalow' || cat.id === 'townhouse') {
                            setBedrooms(3);
                          } else if (cat.id === 'villa') {
                            setBedrooms(4);
                          }
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.01]'
                            : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700'
                        }`}
                      >
                        <span className="font-extrabold text-[11px] leading-tight block">{cat.label}</span>
                        <span className={`text-[9.5px] line-clamp-1 font-normal mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {cat.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.type && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.type}</span>
                  </p>
                )}
              </div>

              {/* Title & Location */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Listing Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearFieldError('title');
                    }}
                    placeholder="e.g. Elegant Loft Room near Sol"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 ${
                      fieldErrors.title
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.title}</span>
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Property Address & Location *</label>
                    {customLat !== null && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>GPS Coordinates Locked</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setLocation(val);
                        clearFieldError('location');
                        if (val.length >= 3) {
                          setIsSearchingAddress(true);
                          setShowAddressDropdown(true);
                          const suggestions = await searchAddressSuggestions(val);
                          setAddressSuggestions(suggestions);
                          setIsSearchingAddress(false);
                        } else {
                          setAddressSuggestions([]);
                          setShowAddressDropdown(false);
                        }
                      }}
                      placeholder="e.g. Calle Gran Vía, 32, Madrid, Spain"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 ${
                        fieldErrors.location
                          ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    {isSearchingAddress && (
                      <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-3" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showAddressDropdown && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {addressSuggestions.map((sug, idx) => (
                        <button
                          key={`sug-${idx}`}
                          type="button"
                          onClick={() => {
                            setLocation(sug.formattedAddress);
                            setCustomLat(sug.lat);
                            setCustomLng(sug.lng);
                            setShowAddressDropdown(false);
                            clearFieldError('location');
                          }}
                          className="w-full text-left p-2.5 hover:bg-emerald-50/80 transition-colors flex items-start gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-xs text-slate-800 block line-clamp-1">{sug.formattedAddress}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Lat: {sug.lat.toFixed(4)}, Lng: {sug.lng.toFixed(4)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Structured Location Selector Helper */}
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Or Quick Select Region / Neighborhood Hierarchy:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* Country */}
                      <div>
                        <select
                          value={modalCountry}
                          onChange={(e) => {
                            const c = e.target.value;
                            setModalCountry(c);
                            setModalState('all');
                            setModalCity('all');
                            setModalArea('all');
                            setLocation(`${c}`);
                            clearFieldError('location');
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                        >
                          {GLOBAL_COUNTRIES.map(c => (
                            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* State */}
                      <div>
                        {(() => {
                          const states = getStatesForCountry(modalCountry);
                          return (
                            <select
                              value={modalState}
                              onChange={(e) => {
                                const st = e.target.value;
                                setModalState(st);
                                setModalCity('all');
                                setModalArea('all');
                                setLocation(st !== 'all' ? `${st}, ${modalCountry}` : modalCountry);
                                clearFieldError('location');
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                            >
                              <option value="all">Select State ({states.length})</option>
                              {states.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>

                      {/* City */}
                      <div>
                        {(() => {
                          const cities = getCitiesForState(modalCountry, modalState);
                          return (
                            <select
                              value={modalCity}
                              onChange={(e) => {
                                const ct = e.target.value;
                                setModalCity(ct);
                                setModalArea('all');
                                const parts = [ct !== 'all' ? ct : '', modalState !== 'all' ? modalState : '', modalCountry].filter(Boolean);
                                setLocation(parts.join(', '));
                                clearFieldError('location');
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                            >
                              <option value="all">Select City ({cities.length})</option>
                              {cities.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Sub-areas / Neighborhood Chips */}
                    {(() => {
                      const areas = getAreasForCity(modalCountry, modalState, modalCity);
                      if (areas.length === 0) return null;
                      return (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">Select Neighborhood / Sub-area:</span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {areas.map(ar => (
                              <button
                                key={`chip-modal-${ar}`}
                                type="button"
                                onClick={() => {
                                  setModalArea(ar);
                                  const parts = [
                                    ar,
                                    modalCity !== 'all' ? modalCity : '',
                                    modalState !== 'all' ? modalState : '',
                                    modalCountry
                                  ].filter(Boolean);
                                  setLocation(parts.join(', '));
                                  clearFieldError('location');
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                                  modalArea === ar
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/80'
                                }`}
                              >
                                {ar}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {fieldErrors.location ? (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.location}</span>
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">Type address, select region dropdowns or click neighborhood chips to auto-fill property location.</span>
                  )}
                </div>
              </div>

              {/* Price & Size stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Monthly Price (€) *</label>
                  <input
                    type="number"
                    min={50}
                    max={50000}
                    value={price || ''}
                    onChange={(e) => {
                      setPrice(parseInt(e.target.value) || 0);
                      clearFieldError('price');
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 ${
                      fieldErrors.price
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {fieldErrors.price && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.price}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Size (m²) *</label>
                  <input
                    type="number"
                    min={5}
                    value={size || ''}
                    onChange={(e) => {
                      setSize(parseInt(e.target.value) || 0);
                      clearFieldError('size');
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 ${
                      fieldErrors.size
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {fieldErrors.size && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.size}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Annual Prepayment Discount Configuration */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Annual Payment Discount (%)</span>
                  </label>
                  <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                    Tenant Incentive
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700/90 leading-tight">
                  Offer a discount to tenants who choose to prepay 12 months upfront.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-28 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={annualDiscountPercentage}
                        onChange={(e) => setAnnualDiscountPercentage(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                        className="w-full pl-3 pr-7 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs font-black text-emerald-600">%</span>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-900 font-medium leading-tight">
                    Annual Rate: <strong>€{Math.round(price * (1 - annualDiscountPercentage / 100))}/mo</strong>
                    <span className="text-[10px] text-emerald-600 block">
                      (Saves tenant €{Math.round(price * (annualDiscountPercentage / 100) * 12)} / year)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Room Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Bedrooms *</label>
                  <select
                    value={bedrooms}
                    disabled={type === 'studio'}
                    onChange={(e) => {
                      setBedrooms(parseInt(e.target.value));
                      clearFieldError('bedrooms');
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 ${
                      fieldErrors.bedrooms
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  >
                    <option value={0}>0 (Studio)</option>
                    <option value={1}>1 Bedroom</option>
                    <option value={2}>2 Bedrooms</option>
                    <option value={3}>3 Bedrooms</option>
                    <option value={4}>4+ Bedrooms</option>
                  </select>
                  {fieldErrors.bedrooms && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.bedrooms}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Bathrooms *</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => {
                      setBathrooms(parseFloat(e.target.value));
                      clearFieldError('bathrooms');
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 ${
                      fieldErrors.bathrooms
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  >
                    <option value={1}>1 Bathroom</option>
                    <option value={1.5}>1.5 Bathrooms</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={3}>3+ Bathrooms</option>
                  </select>
                  {fieldErrors.bathrooms && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.bathrooms}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Device / Computer Photo File Upload Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Property Photos From Device *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {uploadedPhotos.length} {uploadedPhotos.length === 1 ? 'photo' : 'photos'} added
                  </span>
                </div>

                {fieldErrors.images && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{fieldErrors.images}</span>
                  </div>
                )}

                {/* Drag and Drop File Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    fieldErrors.images
                      ? 'border-rose-400 bg-rose-50/30'
                      : isDragging
                      ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                      : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80 bg-slate-50/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        Drag & drop photo files here or <span className="text-emerald-600 underline">browse computer</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Supports high-res JPG, PNG, WEBP (up to 15MB each)
                      </p>
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-[11px] text-rose-700 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Uploaded Photos Gallery Preview Grid */}
                {uploadedPhotos.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Uploaded Photos Gallery
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {uploadedPhotos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition-all hover:shadow-md"
                        >
                          <img
                            src={photo.url}
                            alt={photo.fileName}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Cover photo badge */}
                          {index === 0 ? (
                            <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md shadow uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Cover Photo</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(index)}
                              className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-emerald-600 text-white text-[8.5px] font-bold px-2 py-0.5 rounded-md transition-all shadow cursor-pointer"
                            >
                              Make Cover
                            </button>
                          )}

                          {/* File info badge */}
                          <div className="absolute bottom-1 left-1 right-1 bg-slate-900/70 backdrop-blur-xs text-white p-1 rounded-md flex justify-between items-center text-[8px] font-mono">
                            <span className="truncate max-w-[80px] font-medium">{photo.fileName}</span>
                            <span className="text-slate-300 font-semibold">{photo.sizeKb}KB</span>
                          </div>

                          {/* Delete Photo Action */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-rose-600 text-white p-1 rounded-md hover:bg-rose-700 transition-all shadow cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset Catalog Alternative option */}
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Or select from preset sample photos:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_IMAGES.map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          clearFieldError('images');
                          const presetItem = {
                            id: `preset-${idx}`,
                            url: img.url,
                            fileName: img.label + '.jpg',
                            sizeKb: 350,
                            source: 'preset' as const
                          };
                          setUploadedPhotos(prev => {
                            if (prev.some(p => p.url === img.url)) return prev;
                            return [presetItem, ...prev];
                          });
                        }}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 hover:border-emerald-300 cursor-pointer transition-all group"
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-1.5">
                          <span className="text-[9px] text-white font-semibold truncate w-full flex items-center justify-between">
                            <span>{img.label}</span>
                            <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom URL Option */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1 font-medium">Or paste an external photo URL:</span>
                  <input
                    type="url"
                    value={customImage}
                    onChange={(e) => {
                      setCustomImage(e.target.value);
                      clearFieldError('images');
                    }}
                    placeholder="https://images.unsplash.com/your-custom-image-link"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Amenities Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Choose Amenities Included</label>
                <p className="text-[11px] text-slate-400">Select all amenities available in this home.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`py-2 px-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-400 text-emerald-800'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <span>{amenity}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description box with AI Enhance button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                      Public Description *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Auto-generate a compelling description with Gemini AI
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleAIEnhance();
                      clearFieldError('description');
                    }}
                    disabled={isEnhancing}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-300 text-white text-xs font-black rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                  >
                    {isEnhancing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>AI Enhance</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearFieldError('description');
                    }}
                    placeholder="Describe the home, roomies, vibe, local public transport... or click 'AI Enhance' above to generate automatically based on entered property features!"
                    className={`w-full p-4 bg-slate-50 border rounded-2xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 h-32 resize-none leading-relaxed ${
                      fieldErrors.description
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  
                  {enhanceSuccess && (
                    <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 animate-fade-in">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Enhanced with Gemini API!</span>
                    </div>
                  )}
                </div>
                {fieldErrors.description && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.description}</span>
                  </p>
                )}

                {/* AI feature badge helper */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>AI Copywriter:</strong> Click <strong>'AI Enhance'</strong> to automatically transform your property type ({type}), price (€{price}), size ({size}m²), and amenities into an engaging listing description.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => {
              setFieldErrors({});
              setValidationSummary(null);
              setStep(s => s - 1);
            }}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Listing</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
