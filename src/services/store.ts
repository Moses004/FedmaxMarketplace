import { Listing, Booking, User, BookingMessage } from '../types';

// Seed Listings
const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'list-1',
    title: 'Bright Premium Room near Plaza Mayor',
    description: 'Fully furnished, exterior room in a newly renovated shared apartment. Outstanding location in the historical center of Madrid, just a 2-minute walk from Plaza Mayor and Sol. Features a comfortable double bed, spacious wardrobe, desk, chair, and private balcony. Fully equipped shared kitchen, high-speed Wi-Fi, and weekly cleaning of common areas included.',
    price: 650,
    type: 'room',
    location: 'Calle Mayor, 12, 28013 Madrid, Spain',
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
    price: 1100,
    type: 'studio',
    location: 'Calle de Alcalá, 84, 28009 Madrid, Spain',
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
    price: 1850,
    type: 'apartment',
    location: 'Carrer de Mallorca, 185, 08036 Barcelona, Spain',
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
    price: 580,
    type: 'room',
    location: 'Calle del Pez, 20, 28004 Madrid, Spain',
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
  { id: 'guest-1', name: 'Moses Archibong', email: 'mosesarchibong004@gmail.com', role: 'guest' },
  { id: 'landlord-1', name: 'Carlos Silva', email: 'landlord@fedmax.com', role: 'landlord' },
  { id: 'landlord-2', name: 'Marta Gomez', email: 'marta@gothic.com', role: 'landlord' }
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
  // Set default logged in user if none is selected
  if (!storage.getItem(CURRENT_USER_KEY)) {
    storage.setItem(CURRENT_USER_KEY, JSON.stringify(INITIAL_USERS[0]));
  }
}

// Ensure storage is set up
initializeStore();

export function getListings(): Listing[] {
  try {
    const raw = storage.getItem(LISTINGS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_LISTINGS;
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
    landlordId: currentUser ? currentUser.id : 'landlord-1'
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

export function confirmBookingPayment(bookingId: string, leaseSignedName: string): Booking | null {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].status = 'confirmed';
    bookings[index].leaseSignedName = leaseSignedName;
    bookings[index].leaseSignedDate = new Date().toISOString().split('T')[0];
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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

