import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { createProperty, updateProperty } from '../services/databaseService';
import { uploadPropertyVideo, uploadPropertyImage, validateVideoFile, getVideoDuration } from '../services/propertyMediaService';
import { supabase } from '../services/supabaseClient';
import { sendListingCreatedNotification } from '../services/emailService';
import { Listing, PropertyType, PROPERTY_CATEGORY_OPTIONS, User } from '../types';
import { X, Check, ArrowRight, ArrowLeft, Plus, Image as ImageIcon, Eye, HelpCircle, Upload, Trash2, FolderPlus, Sparkles, AlertCircle, RefreshCw, Wand2, MapPin, Search, ShieldAlert, DollarSign, Video, Phone, Mail, MessageCircle, Briefcase, User as UserIcon, Building2, Award, Zap, Film, FileVideo, Clock, Play, CheckCircle2 } from 'lucide-react';
import { searchAddressSuggestions, GeocodedAddress, GLOBAL_COUNTRIES, getStatesForCountry, getCitiesForState, getAreasForCity, getCoordinatesForUserLocation, resolveLocationMeta } from '../utils/location';
import { validateStep1, validateStep2, validateListingFull } from '../schemas/listingSchema';
import { SUPPORTED_CURRENCIES, getCurrencyForCountry, convertCurrencyToUSD, convertUSDToCurrency, formatCurrencyAmount } from '../utils/currency';

interface AddListingModalProps {
  onClose: () => void;
  onListingCreated?: () => void;
  onListingUpdated?: (listing: Listing) => void;
  listingToEdit?: Listing | null;
  currentUser?: User | null;
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

const compressImageDataUrl = (dataUrl: string, maxWidth = 1024, quality = 0.72): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
};

export default function AddListingModal({ onClose, onListingCreated, onListingUpdated, listingToEdit, currentUser }: AddListingModalProps) {
  const [step, setStep] = useState(1);
  const [modalCountry, setModalCountry] = useState<string>(listingToEdit?.country || 'Nigeria');
  const [modalState, setModalState] = useState<string>(listingToEdit?.state || 'Lagos State');
  const [modalCity, setModalCity] = useState<string>(listingToEdit?.city || 'Lagos');
  const [modalArea, setModalArea] = useState<string>('all');
  const [title, setTitle] = useState(listingToEdit?.title || '');
  const [description, setDescription] = useState(listingToEdit?.description || '');
  
  // Listing Currency & Pricing Period State
  const [listingCurrency, setListingCurrency] = useState<string>(
    listingToEdit?.currency || (() => getCurrencyForCountry('Nigeria').code)
  );
  const [pricePeriod, setPricePeriod] = useState<'annual' | 'monthly' | 'quarterly'>(
    listingToEdit?.pricePeriod || 'annual'
  );
  const [localPrice, setLocalPrice] = useState<number>(
    listingToEdit?.localPrice || listingToEdit?.price || 2400000
  );
  const [type, setType] = useState<PropertyType>(listingToEdit?.type || 'single-room');
  const [location, setLocation] = useState(listingToEdit?.location || 'Lagos, Nigeria');
  const [bedrooms, setBedrooms] = useState(listingToEdit?.bedrooms ?? 1);
  const [bathrooms, setBathrooms] = useState(listingToEdit?.bathrooms ?? 1);
  const [size, setSize] = useState(listingToEdit?.size ?? 25);
  const [selectedImage, setSelectedImage] = useState(
    listingToEdit?.images?.[0] || PRESET_IMAGES[0].url
  );
  const [customImage, setCustomImage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>(listingToEdit?.videoUrl || '');
  
  // Video upload file state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(
    listingToEdit?.videoMetadata?.duration || null
  );
  const [videoFileError, setVideoFileError] = useState<string | null>(null);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [uploadedPhotos, setUploadedPhotos] = useState<{ id: string; url: string; fileName: string; sizeKb: number; source: 'device' | 'preset' | 'custom'; rawFile?: File }[]>(() => {
    if (listingToEdit?.images && listingToEdit.images.length > 0) {
      return listingToEdit.images.map((imgUrl, i) => ({
        id: `edit-photo-${i}`,
        url: imgUrl,
        fileName: `Photo ${i + 1}`,
        sizeKb: 280,
        source: 'custom' as const
      }));
    }
    return [
      { id: 'preset-1', url: PRESET_IMAGES[0].url, fileName: 'Preset_Bedroom.jpg', sizeKb: 340, source: 'preset' }
    ];
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    listingToEdit?.amenities || ['High-Speed Wi-Fi', 'Double Bed']
  );
  const [annualDiscountPercentage, setAnnualDiscountPercentage] = useState(
    listingToEdit?.annualDiscountPercentage ?? 10
  );
  const [energyRating, setEnergyRating] = useState<'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'>(
    listingToEdit?.energyRating || 'A+'
  );
  const [solarPowered, setSolarPowered] = useState<boolean>(
    listingToEdit?.solarPowered ?? true
  );
  const [customLat, setCustomLat] = useState<number | null>(listingToEdit?.lat ?? null);
  const [customLng, setCustomLng] = useState<number | null>(listingToEdit?.lng ?? null);
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodedAddress[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard Escape listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean up object URL when component unmounts or video preview changes
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);
  
  // Lister & Contact Information State
  const [contactRole, setContactRole] = useState<'landlord' | 'property_manager' | 'agent'>(
    listingToEdit?.contactRole || 'landlord'
  );
  const [landlordName, setLandlordName] = useState<string>(
    listingToEdit?.landlordName || (currentUser ? (currentUser.name || '') : '')
  );
  const [agentCompany, setAgentCompany] = useState<string>(listingToEdit?.agentCompany || '');
  const [contactPhone, setContactPhone] = useState<string>(listingToEdit?.contactPhone || '');
  const [contactWhatsApp, setContactWhatsApp] = useState<string>(listingToEdit?.contactWhatsApp || '');
  const [contactEmail, setContactEmail] = useState<string>(
    listingToEdit?.contactEmail || (currentUser ? (currentUser.email || '') : '')
  );
  const [agentLicense, setAgentLicense] = useState<string>(listingToEdit?.agentLicense || '');
  
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
      reader.onload = async (e) => {
        const resultUrl = e.target?.result as string;
        if (resultUrl) {
          const compressedUrl = await compressImageDataUrl(resultUrl, 1024, 0.72);
          const newPhoto = {
            id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: compressedUrl,
            fileName: file.name,
            sizeKb: Math.round(compressedUrl.length / 1024),
            source: 'device' as const,
            rawFile: file
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

  // Video Upload Handlers
  const handleProcessVideoFile = async (file: File) => {
    setVideoFileError(null);
    if (!file) return;

    try {
      validateVideoFile(file);
    } catch (err: any) {
      setVideoFileError(err.message || 'Unsupported video format. Please upload MP4, WebM or MOV (max 100 MB).');
      return;
    }

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    const objUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(objUrl);
    setVideoDuration(null);

    try {
      const dur = await getVideoDuration(file);
      if (dur) setVideoDuration(dur);
    } catch {
      // ignore
    }
  };

  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessVideoFile(e.target.files[0]);
    }
  };

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(false);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveSelectedVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDuration(null);
    setVideoFileError(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
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
      const priceInUSD = convertCurrencyToUSD(localPrice, listingCurrency);
      const response = await fetch('/api/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          location,
          price: priceInUSD,
          localPrice,
          currency: listingCurrency,
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
      const loc = location || 'a prime neighborhood';
      const formattedRent = formatCurrencyAmount(localPrice, listingCurrency);
      
      const fallbackDesc = `Discover this outstanding ${categoryLabel.toLowerCase()} located in ${loc}. Beautifully styled and tailored for modern living, this ${size} m² home features ${bedrooms > 0 ? `${bedrooms} comfortable bedroom${bedrooms > 1 ? 's' : ''}` : 'an open studio layout'} and ${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}, offering an exceptional balance of style and privacy.\n\nEnjoy premium features and conveniences including ${amenityText}. Conveniently situated near vibrant dining options, public transit stops, and essential shops, this property provides everything needed for a seamless urban lifestyle at ${formattedRent}/month.`;

      setDescription(fallbackDesc);
      setEnhanceSuccess(true);
      setTimeout(() => setEnhanceSuccess(false), 3500);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle Step transitions with Step-level schema validation
  const handleNextStep = () => {
    const priceInUSD = convertCurrencyToUSD(localPrice, listingCurrency);

    if (step === 1) {
      const v1 = validateStep1({
        type,
        title,
        location,
        price: priceInUSD,
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const priceInUSD = convertCurrencyToUSD(localPrice, listingCurrency);

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
      price: priceInUSD,
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

    // Perform canonical location metadata resolution to guarantee valid country, state, city, lat, and lng
    const meta = resolveLocationMeta(location);
    const finalCountry = modalCountry !== 'Nigeria' ? modalCountry : (meta.country || modalCountry || 'Nigeria');
    const finalState = modalState !== 'all' ? modalState : (meta.state || '');
    const finalCity = modalCity !== 'all' ? modalCity : (meta.city || '');

    // Use geocoded custom coordinates if set, or resolved location coordinates, or seed realistic coordinates
    let lat = customLat;
    let lng = customLng;
    if (lat === null || lng === null) {
      if (meta.lat && meta.lng) {
        lat = meta.lat;
        lng = meta.lng;
      } else {
        const baseCoords = getCoordinatesForUserLocation({
          country: finalCountry,
          state: finalState,
          city: finalCity,
          streetAddress: location
        });
        const randomOffsetLat = (Math.random() - 0.5) * 0.01;
        const randomOffsetLng = (Math.random() - 0.5) * 0.01;
        lat = baseCoords.lat + randomOffsetLat;
        lng = baseCoords.lng + randomOffsetLng;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentAuthId = user?.id || currentUser?.id;

      if (listingToEdit) {
        setUploadStatusText('Updating property listing in database...');
        const propertyId = listingToEdit.id;

        // STEP 1: Upload new device photos if any
        let uploadedImageUrls: string[] = [];
        const rawDevicePhotos = uploadedPhotos.filter(p => p.rawFile);
        if (rawDevicePhotos.length > 0 && currentAuthId) {
          setUploadStatusText(`Uploading new property photos to storage (${rawDevicePhotos.length})...`);
          for (const photo of rawDevicePhotos) {
            if (photo.rawFile) {
              try {
                const imgResult = await uploadPropertyImage(photo.rawFile, currentAuthId, propertyId);
                uploadedImageUrls.push(imgResult.url);
              } catch (err: any) {
                console.warn('Failed to upload image file to storage, using fallback:', err);
                if (!photo.url.startsWith('data:') && !photo.url.startsWith('blob:')) {
                  uploadedImageUrls.push(photo.url);
                }
              }
            }
          }
        }

        // Add remaining non-blob/non-data URLs
        uploadedPhotos.forEach(p => {
          if (!p.rawFile && !p.url.startsWith('data:') && !p.url.startsWith('blob:') && !uploadedImageUrls.includes(p.url)) {
            uploadedImageUrls.push(p.url);
          }
        });
        if (customImage && !customImage.startsWith('data:') && !customImage.startsWith('blob:') && !uploadedImageUrls.includes(customImage)) {
          uploadedImageUrls.unshift(customImage);
        }
        if (uploadedImageUrls.length === 0) {
          uploadedImageUrls = listingToEdit.images?.length ? listingToEdit.images : [PRESET_IMAGES[0].url];
        }

        // STEP 2: Upload new video if selected
        let finalVideoUrl: string | undefined = videoUrl.trim() || undefined;
        let finalVideoMetadata: any = listingToEdit.videoMetadata || undefined;

        if (videoFile && currentAuthId) {
          setUploadStatusText('Uploading property video walkthrough (up to 100 MB)...');
          try {
            const videoResult = await uploadPropertyVideo(videoFile, currentAuthId, propertyId);
            finalVideoUrl = videoResult.url;
            finalVideoMetadata = videoResult.metadata;
          } catch (videoErr: any) {
            console.error('Failed to upload video to storage:', videoErr);
            throw new Error(videoErr.message || 'Video upload failed. Please verify the video file format and network connection.');
          }
        } else if (!videoFile && !videoUrl.trim()) {
          finalVideoUrl = undefined;
          finalVideoMetadata = undefined;
        }

        // STEP 3: Update property record
        setUploadStatusText('Saving updated property details...');
        const updated = await updateProperty(propertyId, {
          title: title.trim(),
          description: description.trim(),
          price: priceInUSD,
          pricePeriod,
          localPrice,
          currency: listingCurrency,
          annualDiscountPercentage,
          type,
          location: location.trim(),
          country: finalCountry,
          state: finalState,
          city: finalCity,
          lat,
          lng,
          bedrooms,
          bathrooms,
          size,
          energyRating,
          solarPowered,
          amenities: selectedAmenities,
          images: uploadedImageUrls,
          videoUrl: finalVideoUrl,
          videoMetadata: finalVideoMetadata,
          contactRole,
          landlordName: landlordName.trim() || undefined,
          agentCompany: agentCompany.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactWhatsApp: contactWhatsApp.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          agentLicense: agentLicense.trim() || undefined,
        });

        setUploadStatusText('Listing updated successfully!');
        setIsSubmitting(false);
        setUploadStatusText(null);
        if (onListingUpdated) onListingUpdated(updated);
        if (onListingCreated) onListingCreated();
        onClose();
        return;
      }

      setUploadStatusText('Creating property listing in database...');

      // STEP 1: Create property base record in Supabase
      const initialImages = finalImagesList.filter(url => !url.startsWith('data:') && !url.startsWith('blob:'));
      const fallbackInitialImage = initialImages.length > 0 ? initialImages : [PRESET_IMAGES[0].url];

      const newListing = await createProperty({
        title: title.trim(),
        description: description.trim(),
        price: priceInUSD,
        pricePeriod,
        localPrice,
        currency: listingCurrency,
        annualDiscountPercentage,
        type,
        location: location.trim(),
        country: finalCountry,
        state: finalState,
        city: finalCity,
        lat,
        lng,
        bedrooms,
        bathrooms,
        size,
        energyRating,
        solarPowered,
        amenities: selectedAmenities,
        images: fallbackInitialImage,
        videoUrl: !videoFile && videoUrl.trim() ? videoUrl.trim() : undefined,
        contactRole,
        landlordName: landlordName.trim() || undefined,
        agentCompany: agentCompany.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactWhatsApp: contactWhatsApp.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        agentLicense: agentLicense.trim() || undefined,
        status: 'active',
        availableFrom: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // STEP 2: Real Property ID
      const propertyId = newListing.id;

      // STEP 3 & 4: Upload media files if present
      let uploadedImageUrls: string[] = [];

      // Upload raw image files if any
      const rawDevicePhotos = uploadedPhotos.filter(p => p.rawFile);
      if (rawDevicePhotos.length > 0 && currentAuthId) {
        setUploadStatusText(`Uploading property photos to storage (${rawDevicePhotos.length})...`);
        for (const photo of rawDevicePhotos) {
          if (photo.rawFile) {
            try {
              const imgResult = await uploadPropertyImage(photo.rawFile, currentAuthId, propertyId);
              uploadedImageUrls.push(imgResult.url);
            } catch (err: any) {
              console.warn('Failed to upload image file to storage, using fallback:', err);
              if (!photo.url.startsWith('data:') && !photo.url.startsWith('blob:')) {
                uploadedImageUrls.push(photo.url);
              }
            }
          }
        }
      }

      // Add other non-blob/non-data URLs
      uploadedPhotos.forEach(p => {
        if (!p.rawFile && !p.url.startsWith('data:') && !p.url.startsWith('blob:') && !uploadedImageUrls.includes(p.url)) {
          uploadedImageUrls.push(p.url);
        }
      });
      if (customImage && !customImage.startsWith('data:') && !customImage.startsWith('blob:') && !uploadedImageUrls.includes(customImage)) {
        uploadedImageUrls.unshift(customImage);
      }

      // Ensure at least 1 image URL
      if (uploadedImageUrls.length === 0) {
        uploadedImageUrls = fallbackInitialImage;
      }

      // STEP 4: Upload optional video to ${user.id}/${property.id}/video/
      let finalVideoUrl: string | undefined = !videoFile && videoUrl.trim() ? videoUrl.trim() : undefined;
      let finalVideoMetadata: any = undefined;

      if (videoFile && currentAuthId) {
        setUploadStatusText('Uploading property video walkthrough (up to 100 MB)...');
        try {
          const videoResult = await uploadPropertyVideo(videoFile, currentAuthId, propertyId);
          finalVideoUrl = videoResult.url;
          finalVideoMetadata = videoResult.metadata;
        } catch (videoErr: any) {
          console.error('Failed to upload video to storage:', videoErr);
          throw new Error(videoErr.message || 'Video upload failed. Please verify the video file format and network connection.');
        }
      }

      // STEP 6: Update the property record with final media
      setUploadStatusText('Saving property media and finalizing listing...');
      await updateProperty(propertyId, {
        images: uploadedImageUrls,
        videoUrl: finalVideoUrl,
        videoMetadata: finalVideoMetadata
      });

      setUploadStatusText('Upload complete!');

      // Send email alert to landlord
      if (contactEmail.trim() || currentUser?.email) {
        sendListingCreatedNotification({
          landlordEmail: contactEmail.trim() || currentUser?.email || '',
          landlordName: landlordName.trim() || currentUser?.name || 'Landlord',
          listingTitle: newListing.title,
          listingPrice: localPrice,
          listingLocation: newListing.location,
          category: newListing.type
        }).catch(err => console.error("Error sending listing creation email:", err));
      }

      setIsSubmitting(false);
      setUploadStatusText(null);
      if (onListingCreated) onListingCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to save property in database:', err);
      setIsSubmitting(false);
      setUploadStatusText(null);
      setValidationSummary(err.message || 'Database error: Unable to save property listing. Please ensure you are signed in.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-safe pb-safe modal-scroll-area"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-listing-modal-title"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] max-h-[92dvh] modal-scroll-area"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="add-listing-modal-title" className="font-bold text-slate-800 text-lg">
                {listingToEdit ? 'Edit Property Listing' : 'List Your Property'}
              </h3>
              <p className="text-xs text-slate-400">
                {listingToEdit 
                  ? `Step ${step} of 3 • Update specifications, media, and pricing`
                  : `Step ${step} of 3 • Add details, photos, and video tour`}
              </p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-200/50 cursor-pointer"
              aria-label="Close listing modal"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Step Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                step === 1 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              1. Basic Info
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                step === 2 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              2. Media & Rooms
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                step === 3 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              3. Amenities & Lister
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {uploadStatusText && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in shadow-xs">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
              <div className="flex-1 font-semibold">
                <span>{uploadStatusText}</span>
              </div>
            </div>
          )}

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
                          if (cat.id === 'self-contained' || cat.id === 'office-commercial' || cat.id === 'studio' || cat.id === 'others') {
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

                {type === 'others' && (
                  <div className="p-3 bg-fuchsia-50/80 border border-fuchsia-200 rounded-2xl flex items-start gap-2.5 text-xs text-fuchsia-900 animate-fade-in shadow-xs">
                    <Sparkles className="w-4 h-4 text-fuchsia-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold block text-fuchsia-950">Custom Property / Special Accommodation</span>
                      <span>Describe your unique property details (e.g. Creative Event Space, Industrial Warehouse, Floating Houseboat, Container Home, Co-Working Suite, or Storage Lot) clearly in the title & description fields below.</span>
                    </div>
                  </div>
                )}

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
                            const meta = resolveLocationMeta(sug.formattedAddress);
                            if (meta.country) setModalCountry(meta.country);
                            if (meta.state) setModalState(meta.state);
                            if (meta.city) setModalCity(meta.city);
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
                            
                            // Auto-set regional currency for chosen country
                            const regCurr = getCurrencyForCountry(c).code;
                            setListingCurrency(regCurr);
                            if (regCurr === 'NGN') setLocalPrice(1200000);
                            else if (regCurr === 'EUR') setLocalPrice(850);
                            else if (regCurr === 'GBP') setLocalPrice(750);
                            else setLocalPrice(1000);
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

              {/* Multi-Currency Price & Rent Period Controls */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Rent Pricing & Billing Frequency *</span>
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Set whether you are entering an <strong>Annual (/yr)</strong>, <strong>Monthly (/mo)</strong>, or <strong>Quarterly</strong> rent price.
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full shrink-0 border border-emerald-200">
                    Annual Rent Recommended
                  </span>
                </div>

                {/* Price Period Selection Toggle Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'annual', label: 'Annually (/yr)', badge: 'Standard' },
                    { id: 'monthly', label: 'Monthly (/mo)', badge: 'Short-term' },
                    { id: 'quarterly', label: 'Quarterly', badge: '3 Months' },
                  ].map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => {
                        const newPeriod = period.id as any;
                        if (newPeriod === 'annual' && pricePeriod === 'monthly') {
                          setLocalPrice(prev => prev * 12);
                        } else if (newPeriod === 'monthly' && pricePeriod === 'annual') {
                          setLocalPrice(prev => Math.round(prev / 12));
                        }
                        setPricePeriod(newPeriod);
                        clearFieldError('price');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        pricePeriod === period.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-emerald-50/40'
                      }`}
                    >
                      <span className="text-xs font-black leading-tight">{period.label}</span>
                      <span className={`text-[9px] font-bold mt-0.5 ${pricePeriod === period.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {period.badge}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      {pricePeriod === 'annual' ? 'Annual Rent Amount *' : pricePeriod === 'quarterly' ? 'Quarterly Rent Amount *' : 'Monthly Rent Amount *'}
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={listingCurrency}
                        onChange={(e) => {
                          setListingCurrency(e.target.value);
                          clearFieldError('price');
                        }}
                        className="w-28 px-2.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shrink-0"
                      >
                        {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                          <option key={code} value={code}>
                            {config.symbol} {code}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={localPrice || ''}
                        onChange={(e) => {
                          setLocalPrice(parseInt(e.target.value) || 0);
                          clearFieldError('price');
                        }}
                        placeholder={`e.g. ${pricePeriod === 'annual' ? '2500000' : '200000'} in ${listingCurrency}`}
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-800 font-extrabold focus:outline-none focus:ring-2 ${
                          fieldErrors.price
                            ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Size (m²) *</label>
                    <input
                      type="number"
                      min={5}
                      value={size || ''}
                      onChange={(e) => {
                        setSize(parseInt(e.target.value) || 0);
                        clearFieldError('size');
                      }}
                      placeholder="e.g. 85 m²"
                      className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 ${
                        fieldErrors.size
                          ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
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

                {/* Realtime Breakdown Calculator Box */}
                {(() => {
                  const currSymbol = SUPPORTED_CURRENCIES[listingCurrency]?.symbol || '$';
                  const annualAmount = pricePeriod === 'annual' ? localPrice : pricePeriod === 'quarterly' ? localPrice * 4 : localPrice * 12;
                  const monthlyAmount = pricePeriod === 'annual' ? Math.round(localPrice / 12) : pricePeriod === 'quarterly' ? Math.round(localPrice / 3) : localPrice;
                  const usdEquivalentAnnual = convertCurrencyToUSD(annualAmount, listingCurrency);
                  const usdEquivalentMonthly = Math.round(usdEquivalentAnnual / 12);

                  return (
                    <div className="bg-emerald-50/80 border border-emerald-200/90 p-3 rounded-xl text-xs space-y-1.5 text-emerald-950">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Calculated Rate Summary:</span>
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-700">
                          ~${usdEquivalentAnnual.toLocaleString()} USD / yr (${usdEquivalentMonthly.toLocaleString()} USD / mo)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/60 font-medium">
                        <div>
                          <span className="text-emerald-800">Annual Rent Total:</span>{' '}
                          <strong className="font-black text-emerald-950">{currSymbol}{annualAmount.toLocaleString()} /year</strong>
                        </div>
                        <div>
                          <span className="text-emerald-800">Monthly Breakdown:</span>{' '}
                          <strong className="font-black text-emerald-950">~{currSymbol}{monthlyAmount.toLocaleString()} /month</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {fieldErrors.price && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.price}</span>
                  </p>
                )}
              </div>

              {/* Energy Efficiency & Utilities Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Energy Efficiency Rating (EPC Grade)</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Utility Cost Estimator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Energy Class Grade *</label>
                    <select
                      value={energyRating}
                      onChange={(e) => setEnergyRating(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="A+++">A+++ (Ultra Green & Solar)</option>
                      <option value="A++">A++ (Exceptional Efficiency)</option>
                      <option value="A+">A+ (Superior Inverter/Green)</option>
                      <option value="A">A (High Efficiency)</option>
                      <option value="B">B (Good Standard)</option>
                      <option value="C">C (Moderate)</option>
                      <option value="D">D (Average Grade)</option>
                      <option value="E">E (Below Average)</option>
                      <option value="F">F (Low Efficiency)</option>
                      <option value="G">G (Inefficient)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={solarPowered}
                        onChange={(e) => setSolarPowered(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">Solar PV / Inverter Installed</span>
                        <span className="text-[10px] text-slate-500 block">Reduces grid utility costs for tenants</span>
                      </div>
                    </label>
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

              {/* ============================================================ */}
              {/* PROPERTY MEDIA SECTION (PHOTOS & VIDEO)                       */}
              {/* ============================================================ */}
              <div className="pt-2 border-t border-slate-200 space-y-6">
                <div className="pb-1 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Property Media</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload property photos and an optional video walkthrough
                    </p>
                  </div>
                </div>

                {/* PROPERTY PHOTOS */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Property Photos *</span>
                      </label>
                      <p className="text-[11px] text-slate-500">Upload multiple photos from your device</p>
                    </div>
                    <button
                      type="button"
                      id="add-photos-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold text-xs rounded-xl border border-emerald-200/80 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Photos</span>
                    </button>
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
                      id="property-photos-file-input"
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
                          Drag & drop photo files here or <span className="text-emerald-600 underline">browse device</span>
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
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Uploaded Photos ({uploadedPhotos.length})
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          First photo is the primary cover
                        </span>
                      </div>
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
                      Or select from sample photos:
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
                            <span className="text-[9px] text-white font-semibold truncate w-full flex items-center justify-between min-w-0">
                              <span className="truncate">{img.label}</span>
                              <Plus className="w-3 h-3 text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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

                {/* PROPERTY VIDEO (OPTIONAL) */}
                <div className="space-y-3 pt-5 border-t border-slate-200">
                  <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-1">
                    <div>
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-rose-500" />
                        <span>Property Video (Optional)</span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Add a video tour of your property
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto border border-slate-200/60">
                      MP4, WebM or MOV • Maximum 100 MB
                    </span>
                  </div>

                  {videoFileError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-[11px] text-rose-700 font-medium animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{videoFileError}</span>
                    </div>
                  )}

                  {/* Hidden Real HTML Video File Input */}
                  <input
                    type="file"
                    ref={videoInputRef}
                    id="property-video-file-input"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    onChange={handleVideoInputChange}
                    className="hidden"
                  />

                  {/* If a video has been selected / uploaded or existing from listing */}
                  {videoFile && videoPreviewUrl ? (
                    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-3 space-y-3 shadow-md">
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                        <video
                          src={videoPreviewUrl}
                          controls
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            const dur = Math.round((e.target as HTMLVideoElement).duration);
                            if (dur > 0) setVideoDuration(dur);
                          }}
                          className="w-full h-full object-contain"
                        >
                          Your browser does not support property video playback.
                        </video>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <FileVideo className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{videoFile.name}</span>
                          </p>
                          <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                            <span>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                            {videoDuration && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Ready to upload
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            id="replace-property-video-btn"
                            onClick={() => videoInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace Video</span>
                          </button>
                          <button
                            type="button"
                            id="remove-property-video-btn"
                            onClick={handleRemoveSelectedVideo}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : videoUrl ? (
                    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-3 space-y-3 shadow-md">
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                        <video
                          src={videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        >
                          Your browser does not support property video playback.
                        </video>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <FileVideo className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">Saved Property Video</span>
                          </p>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Active on listing
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            id="replace-saved-video-btn"
                            onClick={() => videoInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace Video</span>
                          </button>
                          <button
                            type="button"
                            id="remove-saved-video-btn"
                            onClick={() => {
                              setVideoUrl('');
                              handleRemoveSelectedVideo();
                            }}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* If no video has been selected: Show "No property video selected" state box with "+ Upload Property Video" button */
                    <div
                      onDragOver={handleVideoDragOver}
                      onDragLeave={handleVideoDragLeave}
                      onDrop={handleVideoDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isVideoDragging
                          ? 'border-rose-500 bg-rose-50/60 scale-[1.01]'
                          : 'border-slate-200 hover:border-rose-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
                          <Film className="w-6 h-6 stroke-[2]" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">
                            No property video selected
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Drag & drop a video walkthrough or tap below to choose from device
                          </p>
                        </div>
                        <button
                          type="button"
                          id="upload-property-video-btn"
                          onClick={() => videoInputRef.current?.click()}
                          className="mt-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Upload className="w-4 h-4" />
                          <span>+ Upload Property Video</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Custom External Video Link Alternative */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1 font-medium">Or paste an external HD video link:</span>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://assets.mixkit.co/.../video.mp4 or YouTube / Vimeo link"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
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
                      <strong>AI Copywriter:</strong> Click <strong>'AI Enhance'</strong> to automatically transform your property type ({type}), price ({formatCurrencyAmount(localPrice, listingCurrency)}), size ({size}m²), and amenities into an engaging listing description.
                    </span>
                  </div>
                </div>
              </div>

              {/* LISTER & CONTACT INFORMATION CARD */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>Lister & Contact Information</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Let prospective tenants know if you are the Landlord, Property Manager, or Real Estate Agent, and provide direct contact details.
                    </p>
                  </div>
                </div>

                {/* Role selection toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Who is listing this property?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'landlord', label: 'Landlord / Owner', icon: UserIcon },
                      { id: 'property_manager', label: 'Property Management Co.', icon: Building2 },
                      { id: 'agent', label: 'Real Estate Agent', icon: Award }
                    ].map((roleOpt) => {
                      const IconComponent = roleOpt.icon;
                      const isSelected = contactRole === roleOpt.id;
                      return (
                        <button
                          key={roleOpt.id}
                          type="button"
                          onClick={() => setContactRole(roleOpt.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-start gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                          <span className="text-[11px] font-extrabold leading-tight">{roleOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lister / Agent Name and Agency Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {contactRole === 'landlord' ? 'Landlord / Owner Name *' : 'Contact Person / Agent Name *'}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={landlordName}
                        onChange={(e) => setLandlordName(e.target.value)}
                        placeholder={contactRole === 'landlord' ? 'e.g. Chief Adewale Ogunlesi' : 'e.g. Elena Martínez'}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {(contactRole === 'property_manager' || contactRole === 'agent') && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Agency or Management Company *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={agentCompany}
                          onChange={(e) => setAgentCompany(e.target.value)}
                          placeholder="e.g. Lekki Premier Property Management"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Direct Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          if (!contactWhatsApp) {
                            setContactWhatsApp(e.target.value);
                          }
                        }}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        WhatsApp Number
                      </label>
                      {contactPhone && contactWhatsApp !== contactPhone && (
                        <button
                          type="button"
                          onClick={() => setContactWhatsApp(contactPhone)}
                          className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          Copy Phone #
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={contactWhatsApp}
                        onChange={(e) => setContactWhatsApp(e.target.value)}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Email & License / Office */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Contact Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. leasing@agency.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {(contactRole === 'property_manager' || contactRole === 'agent') && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Registration / License / Office
                      </label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={agentLicense}
                          onChange={(e) => setAgentLicense(e.target.value)}
                          placeholder="e.g. LASRERA Reg #0084 or Office Address"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
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
              id="submit-listing-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{listingToEdit ? 'Saving Changes...' : 'Publishing...'}</span>
              ) : (
                <>
                  {listingToEdit ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{listingToEdit ? 'Save Changes' : 'Publish Listing'}</span>
                </>
              )}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}
