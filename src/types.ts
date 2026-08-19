export type PropertyType = 
  | 'single-room' 
  | 'self-contained' 
  | '1-bedroom-flat' 
  | '2-bedroom-flat' 
  | '3plus-bedroom-flat' 
  | 'duplex' 
  | 'penthouse' 
  | 'bungalow' 
  | 'townhouse' 
  | 'villa' 
  | 'shared-apartment' 
  | 'office-commercial'
  | 'room' 
  | 'apartment' 
  | 'studio'
  | 'others';

export type ListingStatus = 'available' | 'new' | 'rented' | 'unavailable' | 'pending_review';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number; // Baseline price in USD (Annual or Monthly based on pricePeriod)
  pricePeriod?: 'annual' | 'monthly' | 'quarterly'; // Billing period for listed price (default 'annual')
  currency?: string; // Regional currency code (e.g. "NGN", "EUR", "GBP", "USD")
  localPrice?: number; // Price in regional currency (e.g. 3600000 NGN per year)
  annualDiscountPercentage?: number; // percentage discount if tenant pays annually (e.g. 10 for 10% off)
  type: PropertyType;
  location: string;
  country?: string; // e.g. "Nigeria", "Spain", "United Kingdom"
  region?: string;  // e.g. "South West", "South East", "Community of Madrid"
  state?: string;   // e.g. "Lagos State", "FCT Abuja", "Community of Madrid"
  city?: string;    // e.g. "Lagos", "Abuja", "Madrid"
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  size: number; // in sqm
  amenities: string[];
  images: string[];
  videoUrl?: string;
  landlordId: string;
  landlordEmail?: string;
  landlordName?: string;
  // Contact & Lister Details for Landlords, Property Management, and Agents
  contactRole?: 'landlord' | 'property_manager' | 'agent';
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  agentCompany?: string; // Agency or Property Management Company Name
  agentLicense?: string; // Registration, License ID, or Office Location
  availableFrom: string;
  status?: ListingStatus;
  // Energy Efficiency & Utilities
  energyRating?: 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  estimatedMonthlyUtilitiesUSD?: number;
  solarPowered?: boolean;
  hvacType?: string;
  insulationQuality?: 'High' | 'Standard' | 'Basic';
  views?: number;
}

export const PROPERTY_CATEGORY_OPTIONS: { id: PropertyType; label: string; description: string }[] = [
  { id: 'single-room', label: 'Single Room', description: 'Private room in a shared apartment or residential building' },
  { id: 'self-contained', label: 'Self-Contained / Studio', description: 'Self-contained unit with private bathroom & kitchen facilities' },
  { id: '1-bedroom-flat', label: '1 Bedroom Flat', description: 'Entire 1-bedroom apartment with living area & bathroom' },
  { id: '2-bedroom-flat', label: '2 Bedroom Flat', description: 'Spacious 2-bedroom flat ideal for small families or sharers' },
  { id: '3plus-bedroom-flat', label: '3+ Bedroom Flat', description: 'Large multi-bedroom family apartment or flat' },
  { id: 'duplex', label: 'Duplex / Maisonette', description: 'Two-story residential unit connected by internal stairs' },
  { id: 'penthouse', label: 'Penthouse', description: 'Luxury top-floor residence with panoramic views & terrace' },
  { id: 'bungalow', label: 'Bungalow / Detached', description: 'Single-story independent detached house' },
  { id: 'townhouse', label: 'Townhouse / Terraced', description: 'Multi-story urban terraced row house' },
  { id: 'villa', label: 'Luxury Villa', description: 'Private luxury house with garden or swimming pool' },
  { id: 'shared-apartment', label: 'Shared Flat / Co-living', description: 'Shared residence with dedicated community amenities' },
  { id: 'office-commercial', label: 'Commercial / Office', description: 'Retail store, workshop, desk space or office suite' },
  { id: 'others', label: 'Others / Custom', description: 'Event hall, warehouse, boat house, land, container home, or unique space' },
];

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
  status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'refunded';
  totalAmount: number;
  createdAt: string;
  billingCycle?: 'monthly' | 'annual';
  effectiveMonthlyPrice?: number;
  annualDiscountPercentage?: number;
  messages?: BookingMessage[];
  leaseSignedName?: string;
  leaseSignedDate?: string;
  paymentMethod?: 'safepay' | 'paystack';
  paymentReference?: string;
  nextPaymentDueDate?: string;
  paymentDueDaysLeft?: number;
  paymentStatus?: 'paid' | 'due_soon' | 'overdue';
  refundReason?: string;
  refundReference?: string;
  refundedAt?: string;
}

export interface PropertyReview {
  id: string;
  listingId: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'landlord';
  phone?: string;
  country?: string;
  region?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  streetAddress?: string;
  taxId?: string;
  preferredMoveInRegion?: string;
}

export interface PayoutAccount {
  method: 'sepa_bank' | 'paystack_bank' | 'paypal';
  accountHolderName: string;
  bankNameOrService: string;
  accountNumberOrIban: string;
  bankCode?: string;
  recipientCode?: string;
  swiftBic?: string;
  isVerified?: boolean;
  verificationStatus?: 'verified' | 'unverified' | 'pending_verification';
  verifiedAt?: string;
  autoPayoutEnabled?: boolean;
  autoPayoutFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'threshold';
  autoPayoutThreshold?: number;
}

export interface PayoutTransaction {
  id: string;
  landlordId: string;
  amount: number;
  method: 'sepa_bank' | 'paystack_bank' | 'paypal';
  accountDetails: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  referenceCode: string;
  note?: string;
}

export type NotificationCategory = 'maintenance' | 'booking' | 'rent_due' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  isRead: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionTab?: 'explore' | 'dashboard' | 'bookings';
  metadata?: {
    bookingId?: string;
    listingId?: string;
    propertyTitle?: string;
    amount?: number;
    dueDate?: string;
    ticketId?: string;
    status?: string;
  };
}

