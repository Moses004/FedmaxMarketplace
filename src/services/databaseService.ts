import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Listing, Booking, PropertyReview } from '../types';
import {
  getProperties as fetchPropertiesFromDb,
  getExploreProperties as fetchExplorePropertiesFromDb,
  getPropertyById as fetchPropertyByIdFromDb,
  createProperty as createPropertyInDb,
  updateProperty as updatePropertyInDb,
  deleteProperty as deletePropertyInDb,
  removePropertyVideo as removePropertyVideoInDb,
  replacePropertyVideo as replacePropertyVideoInDb,
  incrementPropertyViews as incrementPropertyViewsInDb,
  getPropertyViews as getPropertyViewsInDb,
  clearPropertyCache as clearPropertyCacheInDb,
  PropertyLocationFilter,
  PropertyQueryOptions,
  PropertyQueryResult,
  PropertyServiceError
} from './propertyService';
import {
  getBookings as fetchBookingsFromDb,
  getBookingById as fetchBookingByIdFromDb,
  createBooking as createBookingInDb,
  updateBooking as updateBookingInDb,
  approveBooking as approveBookingInDb,
  rejectBooking as rejectBookingInDb,
  cancelBooking as cancelBookingInDb,
  deleteBooking as deleteBookingInDb,
  addBookingMessage as addBookingMessageInDb,
  confirmBookingPayment as confirmBookingPaymentInDb,
  refundBooking as refundBookingInDb,
  getReviewForBooking as getReviewForBookingInDb
} from './bookingService';
import {
  getFavorites as fetchFavoritesFromDb,
  toggleFavorite as toggleFavoriteInDb,
  addFavorite as addFavoriteInDb,
  removeFavorite as removeFavoriteInDb
} from './favoriteService';
import {
  getReviewsForProperty as fetchReviewsFromDb,
  createReview as createReviewInDb
} from './reviewService';

/**
 * DATABASE SERVICE FOR RENTORA
 * Supabase PostgreSQL backend is the single source of truth.
 */

// ==========================================
// PROPERTIES CRUD
// ==========================================

export async function getProperties(locationFilter?: PropertyLocationFilter, landlordId?: string): Promise<Listing[]> {
  return fetchPropertiesFromDb(locationFilter, landlordId);
}

export async function getExploreProperties(options?: PropertyQueryOptions): Promise<PropertyQueryResult> {
  return fetchExplorePropertiesFromDb(options);
}

export {
  clearPropertyCacheInDb as clearPropertyCache,
  PropertyServiceError
};
export type { PropertyLocationFilter, PropertyQueryOptions, PropertyQueryResult };

export async function getPropertyById(id: string): Promise<Listing | null> {
  return fetchPropertyByIdFromDb(id);
}

export async function createProperty(propertyInput: Omit<Listing, 'id' | 'landlordId'> & { landlordId?: string }): Promise<Listing> {
  return createPropertyInDb(propertyInput);
}

export async function updateProperty(id: string, updates: Partial<Listing>): Promise<Listing> {
  return updatePropertyInDb(id, updates);
}

export async function deleteProperty(id: string): Promise<void> {
  return deletePropertyInDb(id);
}

export async function removePropertyVideo(propertyId: string, currentVideoUrl?: string | null): Promise<Listing> {
  return removePropertyVideoInDb(propertyId, currentVideoUrl);
}

export async function replacePropertyVideo(propertyId: string, newVideoFile: File, oldVideoUrl?: string | null): Promise<Listing> {
  return replacePropertyVideoInDb(propertyId, newVideoFile, oldVideoUrl);
}

export async function incrementListingViews(id: string): Promise<number> {
  return incrementPropertyViewsInDb(id);
}

export async function getListingViews(id: string): Promise<number> {
  return getPropertyViewsInDb(id);
}

// ==========================================
// BOOKINGS CRUD
// ==========================================

export async function getBookings(filter?: { guestId?: string; userId?: string; propertyId?: string; listingId?: string }): Promise<Booking[]> {
  return fetchBookingsFromDb(filter);
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  return fetchBookingByIdFromDb(bookingId);
}

export async function createBooking(
  bookingInput: any
): Promise<Booking> {
  return createBookingInDb(bookingInput);
}

export async function approveBooking(bookingId: string): Promise<Booking> {
  return approveBookingInDb(bookingId);
}

export async function rejectBooking(bookingId: string, reason?: string): Promise<Booking> {
  return rejectBookingInDb(bookingId, reason);
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  return cancelBookingInDb(bookingId, reason);
}

export async function updateBookingStatus(
  id: string,
  status: Booking['status'],
  extraFields?: Partial<Booking>
): Promise<Booking> {
  if (status === 'approved' && (!extraFields || Object.keys(extraFields).length === 0)) {
    return approveBookingInDb(id);
  }
  if (status === 'rejected' && (!extraFields || Object.keys(extraFields).length === 0)) {
    return rejectBookingInDb(id);
  }
  return updateBookingInDb(id, { status, ...extraFields });
}

export async function deleteBooking(id: string): Promise<void> {
  return deleteBookingInDb(id);
}

export async function addBookingMessage(
  bookingId: string,
  message: {
    id?: string;
    senderId: string;
    senderName: string;
    senderRole: 'guest' | 'landlord';
    text: string;
    timestamp?: string;
    isSystemNotice?: boolean;
  }
): Promise<Booking> {
  return addBookingMessageInDb(bookingId, message);
}

export async function confirmBookingPayment(
  bookingId: string,
  leaseSignedName: string,
  paymentMethod: 'safepay' | 'paystack',
  paymentReference?: string
): Promise<Booking> {
  return confirmBookingPaymentInDb(bookingId, leaseSignedName, paymentMethod, paymentReference);
}

export async function refundBooking(
  bookingId: string,
  reason: string,
  refundReference: string
): Promise<Booking> {
  return refundBookingInDb(bookingId, reason, refundReference);
}

export async function getReviewForBooking(bookingId: string): Promise<any | null> {
  return getReviewForBookingInDb(bookingId);
}

// ==========================================
// REVIEWS & RATINGS CRUD
// ==========================================

export async function getReviewsForListing(listingId: string): Promise<PropertyReview[]> {
  return fetchReviewsFromDb(listingId);
}

export async function saveOrUpdateReview(reviewData: Omit<PropertyReview, 'id' | 'createdAt'>): Promise<PropertyReview> {
  return createReviewInDb(reviewData);
}

// ==========================================
// FAVORITES / SAVED PROPERTIES
// ==========================================

export async function getFavorites(userId?: string): Promise<string[]> {
  return fetchFavoritesFromDb(userId);
}

export async function toggleFavorite(listingId: string, userId?: string): Promise<boolean> {
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId) return false;
  return toggleFavoriteInDb(effectiveUserId, listingId);
}

// ==========================================
// MAINTENANCE REQUESTS CRUD
// ==========================================

export interface MaintenanceRequestRecord {
  id: string;
  ticketCode: string;
  listingTitle: string;
  tenantName: string;
  tenantEmail: string;
  issueTitle: string;
  description: string;
  status: string;
  landlordNote?: string;
  createdAt: string;
}

export async function getMaintenanceRequests(): Promise<MaintenanceRequestRecord[]> {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getMaintenanceRequests error:', error);
      return [];
    }

    return (data || []).map((r: any): MaintenanceRequestRecord => ({
      id: String(r.id),
      ticketCode: r.ticket_code || `MT-${r.id}`,
      listingTitle: r.listing_title,
      tenantName: r.tenant_name,
      tenantEmail: r.tenant_email,
      issueTitle: r.issue_title,
      description: r.description || '',
      status: r.status || 'Pending Review',
      landlordNote: r.landlord_note || '',
      createdAt: r.created_at
    }));
  } catch (err) {
    console.error('getMaintenanceRequests exception:', err);
    return [];
  }
}

export async function createMaintenanceRequest(input: Omit<MaintenanceRequestRecord, 'id' | 'createdAt'>): Promise<MaintenanceRequestRecord> {
  const { data: authData } = await supabase.auth.getUser();

  const record = {
    ticket_code: input.ticketCode || `MT-${Date.now()}`,
    listing_title: input.listingTitle,
    tenant_uid: authData?.user?.id || 'anonymous',
    tenant_name: input.tenantName,
    tenant_email: input.tenantEmail,
    issue_title: input.issueTitle,
    description: input.description,
    status: input.status || 'Pending Review',
    landlord_note: input.landlordNote || ''
  };

  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert([record])
    .select('*')
    .single();

  if (error) {
    console.error('Failed to insert maintenance request in Supabase:', error);
    throw new Error(error.message || 'Failed to submit maintenance request.');
  }

  return {
    id: String(data.id),
    ticketCode: data.ticket_code,
    listingTitle: data.listing_title,
    tenantName: data.tenant_name,
    tenantEmail: data.tenant_email,
    issueTitle: data.issue_title,
    description: data.description || '',
    status: data.status,
    landlordNote: data.landlord_note || '',
    createdAt: data.created_at
  };
}

// ==========================================
// PAYOUT TRANSACTIONS (READ-ONLY VIA RLS)
// ==========================================

export async function getPayoutTransactions(landlordId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from('payout_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (landlordId) {
      query = query.eq('landlord_id', landlordId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getPayoutTransactions error:', error);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}


// ==========================================
// REAL-TIME LISTENER FOR SUPABASE
// ==========================================

export function subscribeToSupabaseChanges(tableName: string, callback: (payload?: any) => void, schema = 'public'): (() => void) | null {
  try {
    const channel = supabase
      .channel(`${schema}:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema, table: tableName },
        (payload) => callback(payload)
      )
      .subscribe((status, err) => {
        if (err || status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.info(`[Supabase Realtime Channel Status: ${status} for ${schema}.${tableName}]`, err?.message || '');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.info(`[Supabase ${schema}.${tableName} Subscription Notice]:`, err);
    return null;
  }
}

export function subscribeToStorageObjects(bucketId: string, callback: () => void): (() => void) | null {
  try {
    const channel = supabase
      .channel(`storage:${bucketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'storage', table: 'objects', filter: `bucket_id=eq.${bucketId}` },
        () => callback()
      )
      .subscribe((status, err) => {
        if (err || status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.info(`[Supabase Storage Channel Status: ${status} for ${bucketId}]`, err?.message || '');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.info(`[Supabase Storage Bucket ${bucketId} Subscription Notice]:`, err);
    return null;
  }
}

// ==========================================
// PAYSTACK EDGE FUNCTIONS INTEGRATION
// ==========================================
export {
  initializePaystackPayment,
  verifyPaystackPayment,
  redirectToPaystackCheckout
} from './paystackService';

