import React, { useState } from 'react';
import { createListing } from '../services/store';
import { Listing } from '../types';
import { X, Check, ArrowRight, ArrowLeft, Plus, Image, Eye, HelpCircle } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(700);
  const [type, setType] = useState<'room' | 'apartment' | 'studio'>('room');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [size, setSize] = useState(25);
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImage, setCustomImage] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['High-Speed Wi-Fi', 'Double Bed']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle amenities selection
  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Seed slightly offset coordinates near center of Madrid so that the marker places naturally on the map
    // Center is (40.4167, -3.7037).
    const randomOffsetLat = (Math.random() - 0.5) * 0.04;
    const randomOffsetLng = (Math.random() - 0.5) * 0.05;
    const lat = 40.4167 + randomOffsetLat;
    const lng = -3.7037 + randomOffsetLng;

    setTimeout(() => {
      createListing({
        title,
        description: description || `This beautiful ${type} located in ${location || 'Madrid'} is fully equipped and perfect for young professionals or students. Featuring great amenities and premium furnishings.`,
        price,
        type,
        location: location || 'Calle Gran Vía, 32, 28013 Madrid, Spain',
        lat,
        lng,
        bedrooms,
        bathrooms,
        size,
        amenities: selectedAmenities,
        images: [customImage || selectedImage],
        availableFrom: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 days in future
      });

      setIsSubmitting(false);
      onListingCreated();
    }, 1000);
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
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Home Type Toggle Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Property Category</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['room', 'studio', 'apartment'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        if (t === 'studio') {
                          setBedrooms(0);
                        } else if (bedrooms === 0) {
                          setBedrooms(1);
                        }
                      }}
                      className={`py-3.5 px-3 rounded-2xl font-bold text-xs border text-center transition-all ${
                        type === t
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                      }`}
                    >
                      {t === 'room' ? 'Shared Room' : t === 'studio' ? 'Private Studio' : 'Entire Apartment'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Location */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Listing Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Elegant Loft Room near Sol"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Location Address</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Calle Gran Vía, 32, Madrid"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Specify address. Coordinates near Madrid will be auto-calculated.</span>
                </div>
              </div>

              {/* Price & Size stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Monthly Price (€)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    max={10000}
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Size (m²)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Room Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Bedrooms</label>
                  <select
                    value={bedrooms}
                    disabled={type === 'studio'}
                    onChange={(e) => setBedrooms(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value={0}>0 (Studio)</option>
                    <option value={1}>1 Bedroom</option>
                    <option value={2}>2 Bedrooms</option>
                    <option value={3}>3 Bedrooms</option>
                    <option value={4}>4+ Bedrooms</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Bathrooms</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value={1}>1 Bathroom</option>
                    <option value={1.5}>1.5 Bathrooms</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={3}>3+ Bathrooms</option>
                  </select>
                </div>
              </div>

              {/* Photo Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Property Photo</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedImage(img.url);
                        setCustomImage('');
                      }}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        selectedImage === img.url && !customImage
                          ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[9px] text-white font-semibold truncate w-full">{img.label}</span>
                      </div>
                      {selectedImage === img.url && !customImage && (
                        <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white p-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Custom URL Option */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1 font-medium">Or paste a custom image URL:</span>
                  <input
                    type="url"
                    value={customImage}
                    onChange={(e) => setCustomImage(e.target.value)}
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

              {/* Description box */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Public Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the home, roomies, vibe, local public transport..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-24 resize-none"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
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
