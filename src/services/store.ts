import { Listing, Booking, User, BookingMessage, PropertyReview, PayoutAccount, PayoutTransaction } from '../types';

// Seed Listings
const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'list-ng-1',
    title: 'Luxury 2-Bedroom Serviced Apartment in Lekki Phase 1',
    description: 'Exquisite 2-bedroom luxury serviced flat in the heart of Lekki Phase 1, Lagos. Features 24/7 power supply with industrial inverter/generator backup, fitted kitchen, washing machine, swimming pool, gym, and 24-hour armed uniform security guard. Walking distance to Admiralty Way shops, cafes, and restaurants.',
    price: 850,
    localPrice: 1275000,
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
    availableFrom: '2026-08-01'
  },
  {
    id: 'list-ng-2',
    title: 'Executive Self-Contained Studio in Ikeja GRA',
    description: 'Modern, secure self-contained studio unit situated in quiet, gated Ikeja GRA. Comes with private ensuite bathroom, kitchenette, inverter backup, clean borehole water system, DSTV cable connection, and dedicated parking space. Ideal for young professionals or business executives.',
    price: 450,
    localPrice: 675000,
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
    availableFrom: '2026-08-05'
  },
  {
    id: 'list-ng-3',
    title: '3-Bedroom Duplex with Boys Quarters in Maitama',
    description: 'Prestige 3-bedroom semi-detached duplex residence with 1-room BQ located in diplomatic Maitama District, Abuja. Features expansive marble living rooms, central air conditioning, private green lawn garden, covered carport, and top-tier security.',
    price: 1600,
    localPrice: 2400000,
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
    availableFrom: '2026-09-01'
  },
  {
    id: 'list-ng-4',
    title: 'Spacious 3-Bedroom Flat in GRA Phase 2, Port Harcourt',
    description: 'Modern, freshly painted 3-bedroom apartment unit in serene GRA Phase 2, Port Harcourt. Features all rooms ensuite, water treatment plant, silent soundproof generator, and spacious balcony.',
    price: 750,
    localPrice: 1125000,
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
    availableFrom: '2026-08-15'
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
  }
];

// Seed Bookings
const INITIAL_BOOKINGS: Booking[] = [
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

// Safe storage wrapper (supports sandboxed environments where localStorage might throw)
class MemoryStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return this.store[key] || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      this.store[key] = value;
    }
  }
}

const storage = new MemoryStorage();

// Storage keys
const LISTINGS_KEY = 'fedmax_listings';
const BOOKINGS_KEY = 'fedmax_bookings';
const CURRENT_USER_KEY = 'fedmax_current_user';
const USERS_KEY = 'fedmax_users';

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
}

// Ensure storage is set up
initializeStore();

export function getListings(): Listing[] {
  try {
    const raw = storage.getItem(LISTINGS_KEY);
    const parsed: Listing[] = raw ? JSON.parse(raw) : INITIAL_LISTINGS;
    return parsed.map(l => ({
      ...l,
      status: l.status || (l.id === 'list-1' ? 'new' : l.id === 'list-3' ? 'rented' : l.id === 'list-10' ? 'unavailable' : 'available')
    }));
  } catch {
    return INITIAL_LISTINGS;
  }
}

export function saveListings(listings: Listing[]) {
  storage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

export function createListing(listing: Omit<Listing, 'id' | 'landlordId'>): Listing {
  const listings = getListings();
  const currentUser = getCurrentUser();
  const newListing: Listing = {
    ...listing,
    id: `list-${Date.now()}`,
    landlordId: currentUser ? currentUser.id : 'landlord-1',
    status: listing.status || 'new'
  };
  listings.unshift(newListing);
  saveListings(listings);
  return newListing;
}

export function deleteListing(id: string) {
  const listings = getListings();
  const filtered = listings.filter(l => l.id !== id);
  saveListings(filtered);
}

export function updateListing(id: string, updatedFields: Partial<Listing>): Listing | null {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === id);
  if (index !== -1) {
    listings[index] = { ...listings[index], ...updatedFields };
    saveListings(listings);
    return listings[index];
  }
  return null;
}

export function getBookings(): Booking[] {
  try {
    const raw = storage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBookings(bookings: Booking[]) {
  storage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
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
    bookings[index].status = 'confirmed';
    bookings[index].leaseSignedName = leaseSignedName;
    bookings[index].leaseSignedDate = new Date().toISOString().split('T')[0];
    bookings[index].paymentMethod = paymentMethod;
    bookings[index].paymentReference = paymentReference || `REF-${paymentMethod.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    saveBookings(bookings);
    return bookings[index];
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


