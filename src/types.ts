export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number; // in EUR per month
  type: 'room' | 'apartment' | 'studio';
  location: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  size: number; // in sqm
  amenities: string[];
  images: string[];
  landlordId: string;
  availableFrom: string;
}

export interface BookingMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  guestId: string;
  guestName: string;
  guestEmail: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'confirmed';
  totalAmount: number;
  createdAt: string;
  messages?: BookingMessage[];
  leaseSignedName?: string;
  leaseSignedDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'landlord';
}
