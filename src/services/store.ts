import { Listing, Booking, User, BookingMessage, PropertyReview, PayoutAccount, PayoutTransaction } from '../types';
import { isSupabaseConfigured, getSupabase } from '../lib/supabase';
import { 
  getListingsFromSupabase, 
  saveListingToSupabase, 
  deleteListingFromSupabase, 
  syncListingsToSupabase,
  getBookingsFromSupabase,
  createBookingInSupabase 
} from './supabaseService';

// Seed Listings
const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'list-ng-1',
    title: 'Luxury 2-Bedroom Serviced Apartment in Lekki Phase 1',
    description: 'Exquisite 2-bedroom luxury serviced flat in the heart of Lekki Phase 1, Lagos. Features 24/7 power supply with industrial inverter/generator backup, fitted kitchen, washing machine, swimming pool, gym, and 24-hour armed uniform security guard. Walking distance to Admiralty Way shops, cafes, and restaurants.',
    price: 10200,
    pricePeriod: 'annual',
    localPrice: 15300000,
    currency: 'NGN',
    annualDiscountPercentage: 12,
    type: '2-bedroom-flat',
    location: 'Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
    country: 'Nigeria',
    state: 'Lagos State',
    city: 'Lagos',
    lat: 6.4474,
    lng: 3.4723,
    bedrooms: 2,
    bathrooms: 2,
    size: 95,
    amenities: ['24/7 Constant Electricity', 'Swimming Pool', 'Armed Security', 'Fully Fitted Kitchen', 'Air Conditioning', 'High-Speed Fiber Internet', 'Water Treatment Plant'],
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-with-large-windows-and-stylish-decor-41582-large.mp4',
    landlordId: 'landlord-3',
    landlordName: 'Adewale Ogunlesi',
    contactRole: 'property_manager',
    agentCompany: 'Lekki Premier Property Management',
    contactPhone: '+234 803 123 4567',
    contactWhatsApp: '+234 803 123 4567',
    contactEmail: 'leasing@lekkipremier.ng',
    agentLicense: 'LASRERA Cert #0084 - Lagos',
    availableFrom: '2026-08-01',
    energyRating: 'A+',
    estimatedMonthlyUtilitiesUSD: 85,
    solarPowered: true,
    hvacType: 'Inverter Multi-Split Air Conditioning',
    insulationQuality: 'High'
  },
  {
    id: 'list-ng-2',
    title: 'Executive Self-Contained Studio in Ikeja GRA',
    description: 'Modern, secure self-contained studio unit situated in quiet, gated Ikeja GRA. Comes with private ensuite bathroom, kitchenette, inverter backup, clean borehole water system, DSTV cable connection, and dedicated parking space. Ideal for young professionals or business executives.',
    price: 5400,
    pricePeriod: 'annual',
    localPrice: 8100000,
    currency: 'NGN',
    annualDiscountPercentage: 10,
    type: 'self-contained',
    location: 'Isaac John Street, Ikeja GRA, Lagos, Nigeria',
    country: 'Nigeria',
    state: 'Lagos State',
    city: 'Lagos',
    lat: 6.5912,
    lng: 3.3580,
    bedrooms: 0,
    bathrooms: 1,
    size: 35,
    amenities: ['Inverter Electricity Backup', 'Private Bathroom', 'Air Conditioning', 'DSTV Connection', '24/7 Security Gate', 'Parking Space'],
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-3',
    landlordName: 'Engr. Tunde Adebayo',
    contactRole: 'landlord',
    contactPhone: '+234 802 987 6543',
    contactWhatsApp: '+234 802 987 6543',
    contactEmail: 'tunde.adebayo@gmail.com',
    availableFrom: '2026-08-05',
    energyRating: 'B',
    estimatedMonthlyUtilitiesUSD: 45,
    solarPowered: false,
    hvacType: 'Split AC + Inverter Unit',
    insulationQuality: 'Standard'
  },
  {
    id: 'list-ng-3',
    title: '3-Bedroom Duplex with Boys Quarters in Maitama',
    description: 'Prestige 3-bedroom semi-detached duplex residence with 1-room BQ located in diplomatic Maitama District, Abuja. Features expansive marble living rooms, central air conditioning, private green lawn garden, covered carport, and top-tier security.',
    price: 19200,
    pricePeriod: 'annual',
    localPrice: 28800000,
    currency: 'NGN',
    annualDiscountPercentage: 15,
    type: 'duplex',
    location: 'Gana Street, Maitama, Abuja, Nigeria',
    country: 'Nigeria',
    state: 'Federal Capital Territory (Abuja)',
    city: 'Abuja',
    lat: 9.0882,
    lng: 7.4983,
    bedrooms: 3,
    bathrooms: 3.5,
    size: 210,
    amenities: ['Private Garden', 'Inverter & Solar Power', '1-Room BQ Included', 'Covered Carport', 'Marble Floors', '24/7 Security Patrol'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-3',
    landlordName: 'Chinedu Eze',
    contactRole: 'agent',
    agentCompany: 'Abuja Capital Luxury Estates',
    contactPhone: '+234 809 555 8899',
    contactWhatsApp: '+234 809 555 8899',
    contactEmail: 'inquiries@abujacapitalestates.com',
    agentLicense: 'REDAN Reg #4421 - Abuja',
    availableFrom: '2026-09-01',
    energyRating: 'A++',
    estimatedMonthlyUtilitiesUSD: 120,
    solarPowered: true,
    hvacType: 'Solar Hybrid Central HVAC',
    insulationQuality: 'High'
  },
  {
    id: 'list-ng-4',
    title: 'Spacious 3-Bedroom Flat in GRA Phase 2, Port Harcourt',
    description: 'Modern, freshly painted 3-bedroom apartment unit in serene GRA Phase 2, Port Harcourt. Features all rooms ensuite, water treatment plant, silent soundproof generator, and spacious balcony.',
    price: 9000,
    pricePeriod: 'annual',
    localPrice: 13500000,
    currency: 'NGN',
    annualDiscountPercentage: 10,
    type: '3plus-bedroom-flat',
    location: 'Tombia Street, GRA Phase 2, Port Harcourt, Nigeria',
    country: 'Nigeria',
    state: 'Rivers State',
    city: 'Port Harcourt',
    lat: 4.8156,
    lng: 7.0000,
    bedrooms: 3,
    bathrooms: 3,
    size: 140,
    amenities: ['All Rooms Ensuite', 'Soundproof Generator', 'Borehole Water Treatment', '24/7 Security', 'Spacious Balcony'],
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-3',
    landlordName: 'Mrs. Biobele George',
    contactRole: 'property_manager',
    agentCompany: 'Rivers Prime Realtors',
    contactPhone: '+234 805 444 3322',
    contactWhatsApp: '+234 805 444 3322',
    contactEmail: 'contact@riversprime.com.ng',
    agentLicense: 'PH-REDAN-091',
    availableFrom: '2026-08-15'
  },
  {
    id: 'list-ng-uyo-1',
    title: 'Luxury 3-Bedroom Serviced Flat in Ewet Housing Estate',
    description: 'Exquisite 3-bedroom luxury flat located in serene, gated Ewet Housing Estate, Uyo, Akwa Ibom State. Features 24/7 constant power with solar inverter backup, all rooms ensuite, fitted kitchen, security guard, clean treated borehole water, and paved parking lot. Walking distance to Tropicana Entertainment Centre.',
    price: 6800,
    pricePeriod: 'annual',
    localPrice: 10200000,
    currency: 'NGN',
    annualDiscountPercentage: 12,
    type: '3plus-bedroom-flat',
    location: 'Ewet Housing Estate, Uyo, Akwa Ibom State, Nigeria',
    country: 'Nigeria',
    state: 'Akwa Ibom State',
    city: 'Uyo',
    lat: 5.0298,
    lng: 7.9288,
    bedrooms: 3,
    bathrooms: 3,
    size: 130,
    amenities: ['24/7 Constant Electricity', 'Solar Inverter Backup', 'All Rooms Ensuite', 'Armed Security', 'Fully Fitted Kitchen', 'Water Treatment Plant', 'High-Speed Fiber Internet'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-with-large-windows-and-stylish-decor-41582-large.mp4',
    landlordId: 'landlord-3',
    landlordName: 'Arc. Anietie Udoh',
    contactRole: 'property_manager',
    agentCompany: 'Akwa Ibom Luxury Homes Ltd',
    contactPhone: '+234 803 777 9900',
    contactWhatsApp: '+234 803 777 9900',
    contactEmail: 'anietie@akwaimpactproperties.ng',
    agentLicense: 'AK-REDAN Cert #0128',
    availableFrom: '2026-08-01',
    energyRating: 'A+',
    estimatedMonthlyUtilitiesUSD: 60,
    solarPowered: true,
    hvacType: 'Inverter Multi-Split Air Conditioning',
    insulationQuality: 'High'
  },
  {
    id: 'list-ng-uyo-2',
    title: 'Executive 2-Bedroom Bungalow in Shelter Afrique Estate',
    description: 'Modern, freshly built 2-bedroom bungalow unit situated in quiet, prestigious Shelter Afrique Estate, Uyo, Akwa Ibom State. Comes with private ensuite bedrooms, spacious living lounge, POP ceilings, inverter standby system, clean borehole water, and dedicated parking for 3 vehicles.',
    price: 4800,
    pricePeriod: 'annual',
    localPrice: 7200000,
    currency: 'NGN',
    annualDiscountPercentage: 10,
    type: '2-bedroom-flat',
    location: 'Shelter Afrique Estate, Uyo, Akwa Ibom State, Nigeria',
    country: 'Nigeria',
    state: 'Akwa Ibom State',
    city: 'Uyo',
    lat: 5.0425,
    lng: 7.9250,
    bedrooms: 2,
    bathrooms: 2,
    size: 100,
    amenities: ['Inverter Electricity Backup', 'Private Ensuite Bedrooms', 'POP Ceilings', '24/7 Security Gate', 'Parking Space', 'Water Treatment Plant'],
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-3',
    landlordName: 'Dr. Edidiong Effiong',
    contactRole: 'landlord',
    contactPhone: '+234 802 333 4455',
    contactWhatsApp: '+234 802 333 4455',
    contactEmail: 'edidiong.effiong@gmail.com',
    availableFrom: '2026-08-05',
    energyRating: 'B',
    estimatedMonthlyUtilitiesUSD: 40,
    solarPowered: false,
    hvacType: 'Split AC + Inverter Unit',
    insulationQuality: 'Standard'
  },
  {
    id: 'list-1',
    title: 'Bright Premium Room near Plaza Mayor',
    description: 'Fully furnished, exterior room in a newly renovated shared apartment. Outstanding location in the historical center of Madrid, just a 2-minute walk from Plaza Mayor and Sol. Features a comfortable double bed, spacious wardrobe, desk, chair, and private balcony. Fully equipped shared kitchen, high-speed Wi-Fi, and weekly cleaning of common areas included.',
    price: 700,
    localPrice: 650,
    currency: 'EUR',
    annualDiscountPercentage: 10,
    type: 'room',
    location: 'Calle Mayor, 12, 28013 Madrid, Spain',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    lat: 40.4165,
    lng: -3.7056,
    bedrooms: 1,
    bathrooms: 2,
    size: 18,
    amenities: ['Double Bed', 'Private Balcony', 'High-Speed Wi-Fi', 'Desk', 'Wardrobe', 'Heating', 'Washing Machine'],
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    landlordName: 'Elena Martínez',
    contactRole: 'agent',
    agentCompany: 'Madrid Centro Housing S.L.',
    contactPhone: '+34 600 123 456',
    contactWhatsApp: '+34 600 123 456',
    contactEmail: 'elena@madridcentrohousing.es',
    agentLicense: 'API Reg #2801',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-2',
    title: 'Modern Cozy Studio near Retiro Park',
    description: 'Beautiful, bright self-contained studio apartment located in the prestigious Salamanca district, right next to Retiro Park. Perfect for young professionals or students who value privacy and prime location. Comes with a private fully-equipped kitchenette, private modern bathroom, double bed, smart TV, dining area, and plenty of smart storage spaces.',
    price: 1188,
    localPrice: 1100,
    currency: 'EUR',
    annualDiscountPercentage: 10,
    type: 'studio',
    location: 'Calle de Alcalá, 84, 28009 Madrid, Spain',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    lat: 40.4215,
    lng: -3.6825,
    bedrooms: 0,
    bathrooms: 1,
    size: 28,
    amenities: ['Private Kitchenette', 'Private Bathroom', 'Air Conditioning', 'Smart TV', 'Washing Machine', 'Dishwasher', 'Elevator'],
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-15'
  },
  {
    id: 'list-3',
    title: 'Spacious 2-Bed Design Apartment in Eixample',
    description: 'Stunning designer apartment with classic Catalan vaulted ceilings and high-end finishes. Located in Eixample Esquerra, one of Barcelona\'s most sought-after neighborhoods. The apartment features two double bedrooms, a spacious light-filled living room, fully fitted kitchen, and a private interior terrace. Surrounded by excellent restaurants, supermarkets, and subway links.',
    price: 1998,
    localPrice: 1850,
    currency: 'EUR',
    type: 'apartment',
    location: 'Carrer de Mallorca, 185, 08036 Barcelona, Spain',
    country: 'Spain',
    state: 'Catalonia',
    city: 'Barcelona',
    lat: 41.3895,
    lng: 2.1558,
    bedrooms: 2,
    bathrooms: 1.5,
    size: 75,
    amenities: ['Private Terrace', 'Fully Equipped Kitchen', 'Air Conditioning', 'Washing Machine', 'Dishwasher', 'Superfast Wi-Fi', 'Elevator'],
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-2',
    availableFrom: '2026-09-01'
  },
  {
    id: 'list-4',
    title: 'Elegant Double Room in Trendy Malasaña',
    description: 'Charming, stylish room in a co-living apartment in the heart of Malasaña. Living with three other friendly international students/professionals. The room features high ceilings, a full-size desk, high-speed Wi-Fi, and large windows that flood the room with natural light. The apartment has 2 shared modern bathrooms, a vast living/dining lounge, and a laundry room.',
    price: 626,
    localPrice: 580,
    currency: 'EUR',
    type: 'room',
    location: 'Calle del Pez, 20, 28004 Madrid, Spain',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    lat: 40.4230,
    lng: -3.7042,
    bedrooms: 1,
    bathrooms: 2,
    size: 16,
    amenities: ['Double Bed', 'Large Desk', 'High ceilings', 'Wardrobe', 'Heating', 'Co-working Lounge', 'Washing Machine'],
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-10'
  },
  {
    id: 'list-5',
    title: 'Premium Studio with Sea Views near Barceloneta',
    description: 'Fabulous, bright, and modern studio apartment situated just a 3-minute stroll from Barceloneta Beach. Enjoy breathtaking coastal views from your shared rooftop terrace. Fully fitted modern kitchen, private clean bathroom, comfortable sofa bed (premium mattress), smart study corner, air conditioning, and plenty of natural sea breeze.',
    price: 1250,
    type: 'studio',
    location: 'Carrer de la Maquinista, 42, 08003 Barcelona, Spain',
    country: 'Spain',
    state: 'Catalonia',
    city: 'Barcelona',
    lat: 41.3789,
    lng: 2.1895,
    bedrooms: 0,
    bathrooms: 1,
    size: 32,
    amenities: ['Sea Views', 'Rooftop Access', 'Air Conditioning', 'Private Bathroom', 'Washing Machine', 'Smart Study Desk'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-2',
    availableFrom: '2026-08-20'
  },
  {
    id: 'list-6',
    title: 'Minimalist Loft Apartment in Gothic Quarter',
    description: 'Chic, industrial-style loft apartment featuring exposed stone walls and structural timber beams in the historic Gothic Quarter (Barri Gòtic). One double bedroom, open-plan kitchen and living room, high-spec rainfall shower, high-speed fiber internet, and quiet internal double-glazed windows. A perfect luxury escape right in the historic heart of Barcelona.',
    price: 1600,
    type: 'apartment',
    location: 'Carrer del Bisbe, 5, 08002 Barcelona, Spain',
    country: 'Spain',
    state: 'Catalonia',
    city: 'Barcelona',
    lat: 41.3831,
    lng: 2.1764,
    bedrooms: 1,
    bathrooms: 1,
    size: 55,
    amenities: ['Exposed Stone Walls', 'Rainfall Shower', 'Air Conditioning', 'Superfast Wi-Fi', 'Washing Machine', 'Dishwasher'],
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-2',
    availableFrom: '2026-09-10'
  },
  {
    id: 'list-7',
    title: 'Self-Contained Executive Studio Unit',
    description: 'Fully self-contained private apartment unit with its own private ensuite bathroom, dedicated kitchen nook, air conditioning, and biometric smart lock access. Ideal for privacy-focused professionals.',
    price: 980,
    type: 'self-contained',
    location: 'Calle de Velázquez, 45, 28001 Madrid, Spain',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    lat: 40.4281,
    lng: -3.6832,
    bedrooms: 0,
    bathrooms: 1,
    size: 30,
    amenities: ['Private Ensuite Bathroom', 'Smart Lock', 'Private Kitchenette', 'Air Conditioning', 'High-Speed Wi-Fi'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-8',
    title: 'Luxury Top-Floor Penthouse with Terrace',
    description: 'Breathtaking 2-bedroom penthouse residence with a 45sqm private wrap-around terrace boasting 360-degree skyline views of Madrid. High ceilings, designer fireplace, rainfall bath, and private elevator landing.',
    price: 2400,
    type: 'penthouse',
    location: 'Paseo de la Castellana, 110, 28046 Madrid, Spain',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    lat: 40.4485,
    lng: -3.6912,
    bedrooms: 2,
    bathrooms: 2,
    size: 110,
    amenities: ['Private Skyline Terrace', 'Fireplace', 'Rainfall Shower', 'Private Elevator', '24/7 Doorman', 'Underground Parking'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-2',
    availableFrom: '2026-09-01'
  },
  {
    id: 'list-9',
    title: 'Modern Two-Story Duplex Flat in Chamberí',
    description: 'Elegant split-level duplex apartment featuring double-height ceiling floor-to-ceiling windows, lower living salon with kitchen and upper mezzanine bedroom suite with walk-in wardrobe.',
    price: 1750,
    type: 'duplex',
    location: 'Calle de Santa Engracia, 60, 28010 Madrid, Spain',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    lat: 40.4350,
    lng: -3.7000,
    bedrooms: 2,
    bathrooms: 2,
    size: 85,
    amenities: ['Double-Height Windows', 'Mezzanine Suite', 'Walk-in Closet', 'Dishwasher', 'Central Heating', 'High-Speed Wi-Fi'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-15'
  },
  {
    id: 'list-10',
    title: 'Contemporary Commercial Office Space in Tech Hub',
    description: 'Fully serviced commercial office floor with meeting room, high-speed fiber internet, reception desk, kitchenette, and ergonomic workstation setups. Ideal for growing teams or remote tech agencies.',
    price: 2100,
    type: 'office-commercial',
    location: 'Carrer de Tànger, 86, 08018 Barcelona, Spain',
    country: 'Spain',
    state: 'Catalonia',
    city: 'Barcelona',
    lat: 41.4020,
    lng: 2.1930,
    bedrooms: 0,
    bathrooms: 2,
    size: 140,
    amenities: ['24/7 Security', 'Fiber Optic Wi-Fi', 'Conference Room', 'Kitchenette', 'Air Conditioning', 'Elevator Access'],
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-2',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-others-1',
    title: 'Waterfront Creative Event Studio & Pavilion',
    description: 'Unique multi-purpose waterfront glasshouse venue with acoustic insulation, ambient lighting, private terrace dock, and customizable layout. Ideal for private events, creative studios, workshops, or pop-up spaces.',
    price: 3200,
    pricePeriod: 'annual',
    currency: 'USD',
    type: 'others',
    location: 'Victoria Island Waterfront, Lagos, Nigeria',
    country: 'Nigeria',
    state: 'Lagos State',
    city: 'Lagos',
    lat: 6.4281,
    lng: 3.4219,
    bedrooms: 0,
    bathrooms: 3,
    size: 220,
    amenities: ['Waterfront Deck', 'Acoustic Soundproofing', 'Private VIP Lounge', 'High-Speed Wi-Fi', '24/7 Power', 'Valet Parking'],
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-10'
  },
  {
    id: 'list-us-1',
    title: 'Luxury Beverly Hills 2-Bedroom Residence in Los Angeles',
    description: 'Exquisite 2-bedroom luxury condo in prestigious Beverly Hills, Los Angeles. Features floor-to-ceiling glass windows, private balcony, marble baths, high-speed fiber internet, rooftop pool, and 24/7 concierge.',
    price: 3200,
    pricePeriod: 'monthly',
    currency: 'USD',
    type: '2-bedroom-flat',
    location: 'Wilshire Blvd, Beverly Hills, Los Angeles, California, United States',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    lat: 34.0696,
    lng: -118.4053,
    bedrooms: 2,
    bathrooms: 2,
    size: 110,
    amenities: ['Rooftop Swimming Pool', '24/7 Concierge & Doorman', 'Balcony with City Views', 'High-Speed Fiber Internet', 'EV Charging Station', 'In-Unit Washer & Dryer'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-us-2',
    title: 'Manhattan High-Rise Executive Suite in New York',
    description: 'Modern luxury executive studio located on 5th Avenue, Midtown Manhattan. Walk to Central Park, Broadway, and top corporate headquarters. Features panoramic skyline views, custom chef kitchen, and private gym access.',
    price: 3800,
    pricePeriod: 'monthly',
    currency: 'USD',
    type: 'studio',
    location: '5th Avenue, Midtown Manhattan, New York, NY, United States',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    lat: 40.7549,
    lng: -73.9840,
    bedrooms: 0,
    bathrooms: 1,
    size: 50,
    amenities: ['Skyline Views', 'Private Fitness Center', '24/7 Doorman', 'Central AC & Heating', 'Dishwasher', 'Smart Home Locks'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-15'
  },
  {
    id: 'list-uk-1',
    title: 'Modern Kensington 2-Bed Residence in London',
    description: 'Sophisticated 2-bedroom luxury flat in Royal Borough of Kensington and Chelsea. Features high ceilings, wooden floorboards, private garden access, ultra-fast broadband, and premium finishes.',
    price: 2400,
    pricePeriod: 'monthly',
    currency: 'GBP',
    type: '2-bedroom-flat',
    location: 'High Street Kensington, London, Greater London, United Kingdom',
    country: 'United Kingdom',
    state: 'Greater London',
    city: 'London',
    lat: 51.5010,
    lng: -0.1920,
    bedrooms: 2,
    bathrooms: 2,
    size: 88,
    amenities: ['Private Garden Access', 'Floor Heating', 'High-Speed Broadband', 'Period Architecture', 'Dishwasher', 'Washer-Dryer'],
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-10'
  },
  {
    id: 'list-ca-1',
    title: 'Downtown Waterfront Luxury Condo in Toronto',
    description: 'Chic waterfront 1-bedroom suite in Downtown Toronto with stunning views of Lake Ontario and CN Tower. Includes indoor heated pool, sauna, underground parking, and 24/7 concierge.',
    price: 2600,
    pricePeriod: 'monthly',
    currency: 'CAD',
    type: '1-bedroom-flat',
    location: 'York Street, Downtown Toronto, Ontario, Canada',
    country: 'Canada',
    state: 'Ontario',
    city: 'Toronto',
    lat: 43.6426,
    lng: -79.3871,
    bedrooms: 1,
    bathrooms: 1,
    size: 65,
    amenities: ['Lake Views', 'Indoor Swimming Pool & Sauna', 'Underground Parking', 'Balcony', 'In-Suite Laundry', 'Fitness Gym'],
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-de-1',
    title: 'Stylish Mitte Loft Apartment in Berlin',
    description: 'Designer loft apartment in historic Berlin-Mitte. Walking distance to Alexanderplatz and Hackescher Markt. High ceilings, parquet floors, fully integrated kitchen, and quiet internal courtyard balcony.',
    price: 1650,
    pricePeriod: 'monthly',
    currency: 'EUR',
    type: 'apartment',
    location: 'Friedrichstraße, Mitte, Berlin, Germany',
    country: 'Germany',
    state: 'Berlin',
    city: 'Berlin',
    lat: 52.5186,
    lng: 13.3892,
    bedrooms: 1,
    bathrooms: 1,
    size: 70,
    amenities: ['Parquet Flooring', 'Courtyard Balcony', 'High-Speed Fiber Internet', 'Integrated Appliances', 'Bicycle Storage'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-20'
  },
  {
    id: 'list-gh-1',
    title: 'Luxury 2-Bedroom Serviced Flat in Cantonments, Accra',
    description: 'Premier 2-bedroom apartment in upscale Cantonments, Accra. Comes with standby generator, swimming pool, gym, 24/7 security guard, clean water storage, and balcony.',
    price: 2200,
    pricePeriod: 'monthly',
    localPrice: 35200,
    currency: 'GHS',
    type: '2-bedroom-flat',
    location: 'Cantonments Road, Accra, Greater Accra, Ghana',
    country: 'Ghana',
    state: 'Greater Accra',
    city: 'Accra',
    lat: 5.5800,
    lng: -0.1700,
    bedrooms: 2,
    bathrooms: 2,
    size: 90,
    amenities: ['Standby Generator', 'Swimming Pool', '24/7 Security Patrol', 'Fitted Kitchen', 'Air Conditioning', 'High-Speed Wi-Fi'],
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-ke-1',
    title: 'Executive 2-Bedroom Residence in Westlands, Nairobi',
    description: 'Modern 2-bedroom master ensuite flat in Westlands, Nairobi. Features borehole water supply, backup generator, solar water heating, high-speed lift, and panoramic city views.',
    price: 950,
    pricePeriod: 'monthly',
    localPrice: 125000,
    currency: 'KES',
    type: '2-bedroom-flat',
    location: 'Waiyaki Way, Westlands, Nairobi, Kenya',
    country: 'Kenya',
    state: 'Nairobi County',
    city: 'Nairobi',
    lat: -1.2683,
    lng: 36.8078,
    bedrooms: 2,
    bathrooms: 2,
    size: 85,
    amenities: ['Borehole Water System', 'Full Backup Generator', 'Solar Water Heater', 'High-Speed Lifts', '24/7 Manned Gate'],
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-za-1',
    title: 'Ocean View Luxury Apartment in Sea Point, Cape Town',
    description: 'Breathtaking 2-bedroom oceanfront flat in Sea Point, Cape Town. Enjoy stunning Atlantic sunsets from your private terrace. Walk to the Promenade, cafes, and tidal pools.',
    price: 1350,
    pricePeriod: 'monthly',
    localPrice: 24500,
    currency: 'ZAR',
    type: '2-bedroom-flat',
    location: 'Beach Road, Sea Point, Cape Town, South Africa',
    country: 'South Africa',
    state: 'Western Cape',
    city: 'Cape Town',
    lat: -33.9142,
    lng: 18.3881,
    bedrooms: 2,
    bathrooms: 2,
    size: 95,
    amenities: ['Oceanfront Terrace', 'Inverter Power System', 'Biometric Access', 'Secure Parking', 'Air Conditioning', 'Fiber Internet'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-10'
  },
  {
    id: 'list-ae-1',
    title: 'Dubai Marina Waterfront Luxury Penthouse',
    description: 'Ultra-modern luxury suite in Dubai Marina with direct marina walk access, infinity pool, sauna, smart home automation, and private covered parking.',
    price: 3500,
    pricePeriod: 'monthly',
    localPrice: 12800,
    currency: 'AED',
    type: 'penthouse',
    location: 'Dubai Marina Walk, Dubai, United Arab Emirates',
    country: 'United Arab Emirates',
    state: 'Dubai',
    city: 'Dubai',
    lat: 25.0772,
    lng: 55.1332,
    bedrooms: 2,
    bathrooms: 2.5,
    size: 130,
    amenities: ['Marina Waterfront View', 'Infinity Swimming Pool', 'Valet Parking', 'Smart Home Automation', '24/7 Security & Concierge'],
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    landlordId: 'landlord-1',
    availableFrom: '2026-08-01'
  }
];

// Seed Bookings
const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-3',
    listingId: 'list-ng-1',
    listingTitle: 'Luxury 2-Bedroom Serviced Apartment in Lekki Phase 1',
    listingImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    listingPrice: 10200,
    guestId: 'guest-1',
    guestName: 'Moses Archibong',
    guestEmail: 'mosesarchibong004@gmail.com',
    startDate: '2025-08-08',
    endDate: '2026-08-08',
    status: 'confirmed',
    totalAmount: 15300000,
    createdAt: '2025-08-08T10:00:00.000Z',
    billingCycle: 'annual',
    leaseSignedName: 'Moses Archibong',
    leaseSignedDate: '2025-08-08',
    paymentMethod: 'paystack',
    paymentReference: 'PAY-ANNUAL-2025-8841',
    nextPaymentDueDate: '2026-08-08',
    paymentDueDaysLeft: 3,
    paymentStatus: 'due_soon'
  },
  {
    id: 'book-1',
    listingId: 'list-1',
    listingTitle: 'Bright Premium Room near Plaza Mayor',
    listingImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    listingPrice: 650,
    guestId: 'guest-1',
    guestName: 'Moses Archibong',
    guestEmail: 'mosesarchibong004@gmail.com',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    status: 'pending',
    totalAmount: 1950,
    createdAt: '2026-07-15T10:00:00.000Z'
  },
  {
    id: 'book-2',
    listingId: 'list-3',
    listingTitle: 'Spacious 2-Bed Design Apartment in Eixample',
    listingImage: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
    listingPrice: 1850,
    guestId: 'guest-2',
    guestName: 'Emma Watson',
    guestEmail: 'emma@example.com',
    startDate: '2026-10-01',
    endDate: '2027-01-31',
    status: 'approved',
    totalAmount: 7400,
    createdAt: '2026-07-14T14:30:00.000Z'
  }
];

// Seed Users
const INITIAL_USERS: User[] = [
  { 
    id: 'guest-1', 
    name: 'Moses Archibong', 
    email: 'mosesarchibong004@gmail.com', 
    role: 'guest',
    phone: '+234 801 234 5678',
    country: 'Nigeria',
    state: 'Lagos State',
    city: 'Lagos',
    postalCode: '100001',
    streetAddress: '12 Victoria Island Expressway',
    preferredMoveInRegion: 'Spain'
  },
  { 
    id: 'landlord-1', 
    name: 'Carlos Silva', 
    email: 'landlord@rentora.com', 
    role: 'landlord',
    phone: '+34 612 345 678',
    country: 'Spain',
    state: 'Community of Madrid',
    city: 'Madrid',
    postalCode: '28013',
    streetAddress: 'Calle Mayor, 12',
    taxId: 'ES-12345678Z'
  },
  { 
    id: 'landlord-2', 
    name: 'Marta Gomez', 
    email: 'marta@gothic.com', 
    role: 'landlord',
    phone: '+34 699 876 543',
    country: 'Spain',
    state: 'Catalonia',
    city: 'Barcelona',
    postalCode: '08002',
    streetAddress: 'Carrer del Bisbe, 5',
    taxId: 'ES-98765432Y'
  }
];

// Safe storage wrapper (supports sandboxed environments where localStorage might throw or exceed quota)
class MemoryStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        this.store[key] = val;
        return val;
      }
    } catch {
      // ignore
    }
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`localStorage.setItem failed for key "${key}". Preserving in memory store.`, err);
    }
  }

  removeItem(key: string): void {
    delete this.store[key];
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

const storage = new MemoryStorage();

// Storage keys
const LISTINGS_KEY = 'fedmax_listings';
const BOOKINGS_KEY = 'fedmax_bookings';
const CURRENT_USER_KEY = 'fedmax_current_user';
const USERS_KEY = 'fedmax_users';
const DELETED_LISTINGS_KEY = 'fedmax_deleted_listing_ids';

function getDeletedListingIds(): Set<string> {
  try {
    const raw = storage.getItem(DELETED_LISTINGS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedListingId(id: string) {
  const ids = getDeletedListingIds();
  ids.add(id);
  storage.setItem(DELETED_LISTINGS_KEY, JSON.stringify(Array.from(ids)));
}

export function initFirestoreSync() {
  // Legacy Firestore sync disabled - app is now exclusively connected to Supabase database
  if (isSupabaseConfigured) {
    getListingsFromSupabase().then(supabaseListings => {
      if (supabaseListings && supabaseListings.length > 0) {
        const deletedIds = getDeletedListingIds();
        const validListings = supabaseListings.filter(l => !deletedIds.has(l.id));
        saveListings(validListings);
      }
    }).catch(() => {});

    getBookingsFromSupabase().then(supabaseBookings => {
      if (supabaseBookings && supabaseBookings.length > 0) {
        saveBookings(supabaseBookings);
      }
    }).catch(() => {});
  }
}

export function initializeStore() {
  if (!storage.getItem(LISTINGS_KEY)) {
    storage.setItem(LISTINGS_KEY, JSON.stringify(INITIAL_LISTINGS));
  }
  if (!storage.getItem(BOOKINGS_KEY)) {
    storage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
  }
  if (!storage.getItem(USERS_KEY)) {
    storage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }

  // Start real-time Firestore synchronization
  initFirestoreSync();

  // If Supabase is configured, sync initial listings and fetch remote database properties
  if (isSupabaseConfigured) {
    const currentListings = getListings();
    syncListingsToSupabase(currentListings);
    getListingsFromSupabase().then(sbListings => {
      if (sbListings && sbListings.length > 0) {
        saveListings(sbListings);
      }
    });
    getBookingsFromSupabase().then(sbBookings => {
      if (sbBookings && sbBookings.length > 0) {
        saveBookings(sbBookings);
      }
    });
  }
}

// Ensure storage is set up
initializeStore();

let cachedListingsRaw: string | null = null;
let cachedListingsParsed: Listing[] | null = null;

export function getListings(): Listing[] {
  try {
    const raw = storage.getItem(LISTINGS_KEY);
    const deletedIds = getDeletedListingIds();

    if (raw === cachedListingsRaw && cachedListingsParsed) {
      return cachedListingsParsed.filter(l => !deletedIds.has(l.id));
    }
    let parsed: Listing[] = raw ? JSON.parse(raw) : INITIAL_LISTINGS;
    
    // Auto-merge missing seed listings if missing from stored state AND not explicitly deleted
    if (Array.isArray(parsed)) {
      const existingIds = new Set(parsed.map(l => l.id));
      let newlyAdded = false;
      for (const initListing of INITIAL_LISTINGS) {
        if (!existingIds.has(initListing.id) && !deletedIds.has(initListing.id)) {
          parsed.push(initListing);
          newlyAdded = true;
        }
      }

      if (deletedIds.size > 0) {
        parsed = parsed.filter(l => !deletedIds.has(l.id));
      }

      if (newlyAdded) {
        try {
          storage.setItem(LISTINGS_KEY, JSON.stringify(parsed));
        } catch {
          // ignore storage write errors
        }
      }
    } else {
      parsed = INITIAL_LISTINGS.filter(l => !deletedIds.has(l.id));
    }

    const result = parsed.map(l => ({
      ...l,
      status: l.status || (l.id === 'list-1' ? 'new' : l.id === 'list-3' ? 'rented' : l.id === 'list-10' ? 'unavailable' : 'available')
    }));
    cachedListingsRaw = storage.getItem(LISTINGS_KEY);
    cachedListingsParsed = result;
    return result;
  } catch {
    const deletedIds = getDeletedListingIds();
    return INITIAL_LISTINGS.filter(l => !deletedIds.has(l.id));
  }
}

function notifyStoreChange() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('fedmax_store_change'));
    } catch {
      // ignore event dispatch errors
    }
  }
}

export function saveListings(listings: Listing[]) {
  const json = JSON.stringify(listings);
  storage.setItem(LISTINGS_KEY, json);
  cachedListingsRaw = json;
  cachedListingsParsed = null;
  notifyStoreChange();
}

export function createListing(listing: Omit<Listing, 'id' | 'landlordId'>): Listing {
  const listings = getListings();
  const currentUser = getCurrentUser();
  const newListing: Listing = {
    ...listing,
    id: `list-user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    landlordId: currentUser ? currentUser.id : 'landlord-1',
    status: listing.status || 'new'
  };
  listings.unshift(newListing);
  saveListings(listings);

  // Sync strictly to Supabase database
  if (isSupabaseConfigured) {
    saveListingToSupabase(newListing);
  }

  return newListing;
}

export function deleteListing(id: string) {
  saveDeletedListingId(id);
  const listings = getListings();
  const filtered = listings.filter(l => l.id !== id);
  saveListings(filtered);

  // Delete from Supabase database
  if (isSupabaseConfigured) {
    deleteListingFromSupabase(id);
  }
}

export function updateListing(id: string, updatedFields: Partial<Listing>): Listing | null {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === id);
  if (index !== -1) {
    listings[index] = { ...listings[index], ...updatedFields };
    saveListings(listings);

    // Sync strictly to Supabase database
    if (isSupabaseConfigured) {
      saveListingToSupabase(listings[index]);
    }

    return listings[index];
  }
  return null;
}

let cachedBookingsRaw: string | null = null;
let cachedBookingsParsed: Booking[] | null = null;
let lastBookingCheckTimestamp = 0;

export function getBookings(): Booking[] {
  try {
    const raw = storage.getItem(BOOKINGS_KEY);
    const now = Date.now();

    if (raw === cachedBookingsRaw && cachedBookingsParsed && (now - lastBookingCheckTimestamp < 5000)) {
      return cachedBookingsParsed;
    }

    const bookings: Booking[] = raw ? JSON.parse(raw) : INITIAL_BOOKINGS;

    // Dynamically evaluate payment due status against current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updated = false;
    bookings.forEach((booking) => {
      if (booking.status === 'confirmed' && booking.nextPaymentDueDate) {
        const dueDate = new Date(booking.nextPaymentDueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3 && diffDays >= 0) {
          if (booking.paymentDueDaysLeft !== diffDays || booking.paymentStatus !== 'due_soon') {
            booking.paymentDueDaysLeft = diffDays;
            booking.paymentStatus = 'due_soon';
            updated = true;
          }
        } else if (diffDays < 0) {
          if (booking.paymentStatus !== 'overdue') {
            booking.paymentDueDaysLeft = diffDays;
            booking.paymentStatus = 'overdue';
            updated = true;
          }
        }
      }
    });

    if (updated) {
      saveBookings(bookings);
    } else {
      cachedBookingsRaw = raw;
      cachedBookingsParsed = bookings;
      lastBookingCheckTimestamp = now;
    }

    return bookings;
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBookings(bookings: Booking[]) {
  const json = JSON.stringify(bookings);
  storage.setItem(BOOKINGS_KEY, json);
  cachedBookingsRaw = json;
  cachedBookingsParsed = bookings;
  lastBookingCheckTimestamp = Date.now();
  notifyStoreChange();
}

export function createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: `book-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  bookings.unshift(newBooking);
  saveBookings(bookings);

  // Sync strictly to Supabase database
  if (isSupabaseConfigured) {
    createBookingInSupabase(newBooking);
  }

  return newBooking;
}

export function updateBookingStatus(bookingId: string, status: 'approved' | 'rejected' | 'confirmed'): Booking | null {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].status = status;
    saveBookings(bookings);

    return bookings[index];
  }
  return null;
}

export function addBookingMessage(bookingId: string, message: { senderId: string; senderName: string; text: string }): BookingMessage {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  const newMessage: BookingMessage = {
    id: `msg-${Date.now()}`,
    ...message,
    createdAt: new Date().toISOString()
  };
  
  if (index !== -1) {
    if (!bookings[index].messages) {
      bookings[index].messages = [];
    }
    bookings[index].messages!.push(newMessage);
    saveBookings(bookings);
  }
  return newMessage;
}

export function confirmBookingPayment(
  bookingId: string, 
  leaseSignedName: string, 
  paymentMethod: 'safepay' | 'paystack' = 'safepay',
  paymentReference?: string
): Booking | null {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    const booking = bookings[index];
    booking.status = 'confirmed';
    booking.leaseSignedName = leaseSignedName;
    booking.leaseSignedDate = new Date().toISOString().split('T')[0];
    booking.paymentMethod = paymentMethod;
    booking.paymentReference = paymentReference || `REF-${paymentMethod.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
    // Update payment due state after successful payment
    booking.paymentStatus = 'paid';
    delete booking.paymentDueDaysLeft;

    // Calculate next payment due date based on cycle
    const currentDueDate = booking.nextPaymentDueDate ? new Date(booking.nextPaymentDueDate) : new Date();
    if (booking.billingCycle === 'annual') {
      currentDueDate.setFullYear(currentDueDate.getFullYear() + 1);
    } else {
      currentDueDate.setMonth(currentDueDate.getMonth() + 1);
    }
    booking.nextPaymentDueDate = currentDueDate.toISOString().split('T')[0];

    // Log receipt message
    if (!booking.messages) booking.messages = [];
    booking.messages.push({
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: 'Rentora Payment Gateway',
      text: `💳 Rent Payment Settled via ${paymentMethod.toUpperCase()} (Ref: ${booking.paymentReference}). Next rent payment due on ${booking.nextPaymentDueDate}.`,
      createdAt: new Date().toISOString()
    });

    saveBookings(bookings);
    return booking;
  }
  return null;
}

export function refundBooking(
  bookingId: string, 
  refundReason?: string, 
  refundReference?: string
): Booking | null {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].status = 'refunded';
    bookings[index].refundReason = refundReason || 'Refund requested by landlord via Paystack API';
    bookings[index].refundReference = refundReference || `RFD-PAYSTACK-${Date.now().toString(36).toUpperCase()}`;
    bookings[index].refundedAt = new Date().toISOString();
    saveBookings(bookings);
    return bookings[index];
  }
  return null;
}

const FAVORITES_KEY = 'fedmax_favorites';

export function getFavorites(): string[] {
  try {
    const raw = storage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: string[]) {
  storage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function toggleFavorite(listingId: string): boolean {
  const favorites = getFavorites();
  const idx = favorites.indexOf(listingId);
  let favorited = false;
  if (idx !== -1) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(listingId);
    favorited = true;
  }
  saveFavorites(favorites);
  return favorited;
}

export function getUsers(): User[] {
  try {
    const raw = storage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function getCurrentUser(): User | null {
  try {
    const raw = storage.getItem(CURRENT_USER_KEY);
    if (!raw || raw === 'null' || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function registerUser(payload: Partial<User> & { name: string; email: string; role: 'guest' | 'landlord' }): User {
  const users = getUsers();
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === payload.email.toLowerCase());

  let user: User;
  if (existingIdx !== -1) {
    user = {
      ...users[existingIdx],
      ...payload,
      email: payload.email.toLowerCase(),
    };
    users[existingIdx] = user;
  } else {
    user = {
      id: `${payload.role}-${Date.now()}`,
      ...payload,
      email: payload.email.toLowerCase(),
    };
    users.push(user);
  }

  storage.setItem(USERS_KEY, JSON.stringify(users));
  storage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  notifyStoreChange();
  return user;
}

export function updateUserProfile(updatedData: Partial<User> & { id: string }): User {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedData.id);

  let updatedUser: User;
  if (index !== -1) {
    updatedUser = {
      ...users[index],
      ...updatedData
    };
    users[index] = updatedUser;
  } else {
    updatedUser = updatedData as User;
    users.push(updatedUser);
  }

  storage.setItem(USERS_KEY, JSON.stringify(users));
  storage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  notifyStoreChange();
  return updatedUser;
}

export function login(email: string, role: 'guest' | 'landlord', name?: string): User {
  const users = getUsers();
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Create new user auto-registered
    user = {
      id: `${role}-${Date.now()}`,
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      role
    };
    users.push(user);
    storage.setItem(USERS_KEY, JSON.stringify(users));
  } else if (name) {
    // Update name if supplied
    user.name = name;
    user.role = role; // update role if switched
    storage.setItem(USERS_KEY, JSON.stringify(users));
  } else {
    // Switch role if specified
    user.role = role;
    storage.setItem(USERS_KEY, JSON.stringify(users));
  }
  
  storage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  storage.setItem(CURRENT_USER_KEY, 'null');
}

const VIEWS_KEY = 'fedmax_listing_views';

export function getListingViews(): Record<string, number> {
  try {
    const raw = storage.getItem(VIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  
  // Seed initial views
  const seed: Record<string, number> = {
    'list-1': 142,
    'list-2': 89,
    'list-3': 210,
    'list-4': 76,
    'list-5': 115,
    'list-6': 94,
  };
  storage.setItem(VIEWS_KEY, JSON.stringify(seed));
  return seed;
}

export function incrementListingViews(listingId: string): number {
  const views = getListingViews();
  views[listingId] = (views[listingId] || 0) + 1;
  storage.setItem(VIEWS_KEY, JSON.stringify(views));
  return views[listingId];
}

const REVIEWS_KEY = 'fedmax_property_reviews';

const INITIAL_REVIEWS: PropertyReview[] = [
  {
    id: 'rev-seed-1',
    listingId: 'list-1',
    bookingId: 'book-seed-1',
    guestId: 'guest-1',
    guestName: 'Elena Rostova',
    rating: 5,
    comment: 'Exceptional room! Super clean, brilliant location right next to Sol, and the landlord was extremely helpful throughout my stay.',
    createdAt: '2026-07-10T11:20:00Z'
  }
];

export function getReviews(): PropertyReview[] {
  try {
    const raw = storage.getItem(REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reviews:', e);
  }
  storage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
  return INITIAL_REVIEWS;
}

export function getReviewsForListing(listingId: string): PropertyReview[] {
  return getReviews().filter(r => r.listingId === listingId);
}

export function getReviewForBooking(bookingId: string): PropertyReview | null {
  const reviews = getReviews();
  return reviews.find(r => r.bookingId === bookingId) || null;
}

export function saveOrUpdateReview(reviewData: Omit<PropertyReview, 'id' | 'createdAt'>): PropertyReview {
  const reviews = getReviews();
  const existingIdx = reviews.findIndex(r => r.bookingId === reviewData.bookingId);
  const now = new Date().toISOString();

  if (existingIdx !== -1) {
    const updatedReview: PropertyReview = {
      ...reviews[existingIdx],
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: now
    };
    reviews[existingIdx] = updatedReview;
    storage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    return updatedReview;
  } else {
    const newReview: PropertyReview = {
      ...reviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now
    };
    reviews.unshift(newReview);
    storage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    return newReview;
  }
}

// LANDLORD PAYOUT & WITHDRAWAL STORE MANAGEMENT
const PAYOUT_ACCOUNT_KEY_PREFIX = 'fedmax_payout_account_';
const PAYOUT_TRANSACTIONS_KEY_PREFIX = 'fedmax_payout_txs_';

export function getPayoutAccount(landlordId: string): PayoutAccount | null {
  try {
    const raw = storage.getItem(`${PAYOUT_ACCOUNT_KEY_PREFIX}${landlordId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load payout account:', e);
  }
  
  // Default seed payout account for default landlord using Paystack API Direct Withdrawal
  const defaultAccount: PayoutAccount = {
    method: 'paystack_bank',
    accountHolderName: 'Carlos Rodriguez',
    bankNameOrService: 'Guaranty Trust Bank (Paystack API Direct)',
    accountNumberOrIban: '0123456789',
    bankCode: '058',
    recipientCode: 'RCP_5k82x091z0a',
    isVerified: true,
    verificationStatus: 'verified',
    verifiedAt: '2026-07-01T10:00:00Z',
    autoPayoutEnabled: false
  };
  return defaultAccount;
}

export function savePayoutAccount(landlordId: string, account: PayoutAccount): PayoutAccount {
  storage.setItem(`${PAYOUT_ACCOUNT_KEY_PREFIX}${landlordId}`, JSON.stringify(account));
  return account;
}

export function getPayoutTransactions(landlordId: string): PayoutTransaction[] {
  try {
    const raw = storage.getItem(`${PAYOUT_TRANSACTIONS_KEY_PREFIX}${landlordId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load payout transactions:', e);
  }

  // Seed initial completed payout transaction
  const initialTxs: PayoutTransaction[] = [
    {
      id: 'tx-seed-1',
      landlordId,
      amount: 1200,
      method: 'paystack_bank',
      accountDetails: '0123****89 (GTBank via Paystack Direct)',
      status: 'completed',
      requestedAt: '2026-07-01T10:15:00Z',
      processedAt: '2026-07-01T10:15:28Z',
      referenceCode: 'TRF_982410582910',
      note: 'Paystack Hosted API Direct Commercial Bank Transfer'
    }
  ];
  storage.setItem(`${PAYOUT_TRANSACTIONS_KEY_PREFIX}${landlordId}`, JSON.stringify(initialTxs));
  return initialTxs;
}

export function createPayoutTransaction(
  landlordId: string, 
  amount: number, 
  account: PayoutAccount
): PayoutTransaction {
  const txs = getPayoutTransactions(landlordId);
  const now = new Date().toISOString();
  const dateStr = now.slice(0,10).replace(/-/g, '');
  const refCode = `PAY-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTx: PayoutTransaction = {
    id: `tx-${Date.now()}`,
    landlordId,
    amount,
    method: account.method,
    accountDetails: `${account.bankNameOrService} (${account.accountNumberOrIban.slice(-4) ? '**** ' + account.accountNumberOrIban.slice(-4) : account.accountNumberOrIban})`,
    status: 'completed', // Instant simulation or completed processing
    requestedAt: now,
    processedAt: now,
    referenceCode: refCode,
    note: `Withdrawal to ${account.accountHolderName}`
  };

  txs.unshift(newTx);
  storage.setItem(`${PAYOUT_TRANSACTIONS_KEY_PREFIX}${landlordId}`, JSON.stringify(txs));
  return newTx;
}


