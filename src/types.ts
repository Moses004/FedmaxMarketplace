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

export const CANONICAL_PROPERTY_STATUSES = ['active', 'pending', 'rented', 'inactive'] as const;
export type ListingStatus = typeof CANONICAL_PROPERTY_STATUSES[number];

export interface VideoMetadata {
  name: string;
  mime_type: string;
  size: number;
  duration?: number;
}

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
  videoMetadata?: VideoMetadata | Record<string, any>;
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
  senderRole?: 'guest' | 'landlord';
  text: string;
  createdAt: string;
  timestamp?: string;
  isSystemNotice?: boolean;
}

export interface Booking {
  id: string;
  propertyId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  userId: string;
  guestId: string;
  userName: string;
  guestName: string;
  userEmail: string;
  guestEmail: string;
  userPhone?: string;
  startDate: string;
  endDate: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
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
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'cancelled' | 'due_soon' | 'overdue' | 'unpaid';
  payment_status?: string | null;
  paymentVerified?: boolean;
  payment_verified?: boolean | null;
  paymentVerificationStatus?: 'unverified' | 'pending_verification' | 'verified' | 'failed' | 'refunded';
  payment_verification_status?: string | null;
  refundReason?: string;
  refundReference?: string;
  refundedAt?: string;
  landlordId?: string;
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
  fullName?: string;
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

// ==========================================
// SUPABASE ROW INTERFACES (DATABASE SCHEMA)
// ==========================================

export interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  full_name: string | null;
  role: 'tenant' | 'landlord' | 'admin' | string;
  avatar_url?: string | null;
  phone: string | null;
  country: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  preferred_move_in_region: string | null;
  tax_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyRow {
  id: string | number;
  landlord_id: string | null;
  landlord_name: string | null;
  landlord_email: string | null;
  contact_role?: string | null;
  agent_company?: string | null;
  agent_license?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  title: string;
  description: string | null;
  price: number | null;
  price_period?: string | null;
  local_price?: number | null;
  currency?: string | null;
  annual_discount_percentage?: number | null;
  type?: string | null;
  property_type?: string | null;
  location: string | null;
  country: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  area_sqft?: number | null;
  amenities: string[] | null;
  images: string[] | null;
  image?: string | null;
  video_url?: string | null;
  video_metadata?: VideoMetadata | Record<string, any> | null;
  virtual_tour_url?: string | null;
  status: string | null;
  is_verified?: boolean | null;
  available_from?: string | null;
  energy_rating?: string | null;
  estimated_monthly_utilities_usd?: number | null;
  solar_powered?: boolean | null;
  hvac_type?: string | null;
  views?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface BookingRow {
  id: string | number;
  property_id?: string | number | null;
  listing_id?: string | number | null;
  user_id?: string | null;
  guest_id?: string | null;
  user_name?: string | null;
  guest_name?: string | null;
  user_email?: string | null;
  guest_email?: string | null;
  user_phone?: string | null;
  property_title?: string | null;
  listing_title?: string | null;
  listing_image?: string | null;
  listing_price?: number | null;
  landlord_id?: string | null;
  landlord_name?: string | null;
  start_date: string | null;
  end_date: string | null;
  preferred_date: string;
  preferred_time: string;
  duration_months?: number | null;
  monthly_rent?: number | null;
  deposit_amount?: number | null;
  total_amount: number | null;
  currency?: string | null;
  status: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_verified?: boolean | null;
  payment_verification_status?: string | null;
  billing_cycle?: string | null;
  lease_status?: string | null;
  lease_start_date?: string | null;
  lease_end_date?: string | null;
  lease_signed_name?: string | null;
  lease_signed_date?: string | null;
  messages?: any[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteRow {
  id?: string | number;
  user_id: string;
  property_id?: string | number;
  listing_id?: string | number;
  created_at?: string;
}

export interface ReviewRow {
  id: string | number;
  listing_id?: string | number | null;
  property_id?: string | number | null;
  booking_id?: string | number | null;
  guest_id?: string | null;
  user_id?: string | null;
  guest_name?: string | null;
  user_name?: string | null;
  rating: number;
  comment: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRequestRow {
  id: string | number;
  ticket_code?: string | null;
  property_id?: string | number | null;
  tenant_id?: string | null;
  landlord_id?: string | null;
  issue?: string | null;
  issue_title?: string | null;
  description?: string | null;
  status?: string | null;
  landlord_note?: string | null;
  listing_title?: string | null;
  tenant_name?: string | null;
  tenant_email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PayoutTransactionRow {
  id: string | number;
  landlord_id: string;
  amount: number;
  gross_amount?: number | null;
  commission_rate?: number | null;
  commission_amount?: number | null;
  transfer_amount?: number | null;
  currency?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder_name?: string | null;
  status?: string | null;
  transaction_reference?: string | null;
  reference?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LandlordEarningRow {
  id: string | number;
  landlord_id: string;
  booking_id?: string | number | null;
  payment_transaction_id?: string | number | null;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransactionRow {
  id: string | number;
  booking_id?: string | number | null;
  user_id?: string | null;
  landlord_id?: string | null;
  amount: number;
  currency?: string | null;
  payment_method?: string | null;
  reference: string;
  status: string;
  payment_status?: string | null;
  verification_status?: string | null;
  paystack_status?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

