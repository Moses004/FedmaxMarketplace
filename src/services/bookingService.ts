import { supabase } from './supabaseClient';
import { Booking, BookingRow, BookingMessage } from '../types';

/**
 * Normalizes date to strict YYYY-MM-DD string format.
 */
export function normalizeDateToYYYYMMDD(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Normalizes time to strict HH:MM 24-hour string format.
 */
export function normalizeTimeToHHMM(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Check for HH:MM or HH:MM:SS (24-hour format)
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = parseInt(match24[2], 10);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    // Check for 12-hour AM/PM format (e.g. "10:30 AM", "2:30 PM")
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const meridiem = match12[3].toUpperCase();
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
  }
  return '';
}

/**
 * Canonical booking statuses: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
 */
export function normalizeBookingStatus(status: any): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' {
  if (!status) return 'pending';
  const s = String(status).toLowerCase().trim();
  if (s === 'approved') return 'approved';
  if (s === 'rejected' || s === 'declined' || s === 'refunded') return 'rejected';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'completed' || s === 'confirmed' || s === 'paid' || s === 'active') return 'completed';
  return 'pending';
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed'
};

export function getBookingStatusLabel(status: string): string {
  const normalized = normalizeBookingStatus(status);
  return BOOKING_STATUS_LABELS[normalized] || 'Pending Approval';
}

function normalizePaymentMethod(method: any): 'safepay' | 'paystack' | undefined {
  if (!method) return undefined;
  const m = String(method).toLowerCase();
  if (m === 'paystack') return 'paystack';
  if (m === 'safepay') return 'safepay';
  return undefined;
}

function normalizePaymentStatus(status: any): 'paid' | 'pending' | 'failed' | 'cancelled' | 'due_soon' | 'overdue' | 'unpaid' | undefined {
  if (!status) return undefined;
  const s = String(status).toLowerCase();
  if (s === 'paid' || s === 'success' || s === 'completed') return 'paid';
  if (s === 'pending' || s === 'processing') return 'pending';
  if (s === 'failed' || s === 'fail' || s === 'error') return 'failed';
  if (s === 'cancelled' || s === 'canceled' || s === 'abandoned') return 'cancelled';
  if (s === 'due_soon' || s === 'duesoon') return 'due_soon';
  if (s === 'overdue') return 'overdue';
  if (s === 'unpaid') return 'unpaid';
  return undefined;
}

/**
 * Validates whether a string is a valid UUID.
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id.trim());
}

export function mapRowToBooking(row: Partial<BookingRow> & Record<string, any>): Booking {
  const propertyId = String(row.property_id || row.listing_id || '');
  const listingId = String(row.listing_id || row.property_id || '');
  const userId = String(row.user_id || row.guest_id || '');
  const guestId = String(row.guest_id || row.user_id || '');
  const userName = row.user_name || row.guest_name || 'Guest User';
  const guestName = row.guest_name || row.user_name || 'Guest User';
  const userEmail = row.user_email || row.guest_email || '';
  const guestEmail = row.guest_email || row.user_email || '';
  const userPhone = row.user_phone || undefined;

  const preferredDate = normalizeDateToYYYYMMDD(row.preferred_date || row.start_date || row.created_at) || new Date().toISOString().split('T')[0];
  const preferredTime = normalizeTimeToHHMM(row.preferred_time) || '10:30';
  const startDate = normalizeDateToYYYYMMDD(row.start_date || row.preferred_date || row.created_at) || preferredDate;
  const endDate = normalizeDateToYYYYMMDD(row.end_date) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: String(row.id),
    propertyId,
    listingId,
    listingTitle: row.listing_title || row.property_title || 'Rental Property',
    listingImage: row.listing_image || row.property_image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    listingPrice: Number(row.listing_price || row.total_price || row.total_amount || 0),
    userId,
    guestId,
    userName,
    guestName,
    userEmail,
    guestEmail,
    userPhone,
    startDate,
    endDate,
    preferredDate,
    preferredTime,
    totalAmount: Number(row.total_amount || row.total_price || 0),
    status: normalizeBookingStatus(row.status),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
    billingCycle: row.billing_cycle === 'annual' ? 'annual' : 'monthly',
    effectiveMonthlyPrice: row.effective_monthly_price ? Number(row.effective_monthly_price) : undefined,
    annualDiscountPercentage: row.annual_discount_percentage ? Number(row.annual_discount_percentage) : undefined,
    messages: Array.isArray(row.messages) ? (row.messages as BookingMessage[]) : [],
    leaseSignedName: row.lease_signed_name || undefined,
    leaseSignedDate: row.lease_signed_date || undefined,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    paymentReference: row.payment_reference || undefined,
    nextPaymentDueDate: row.next_payment_due_date || undefined,
    paymentDueDaysLeft: row.payment_due_days_left != null ? Number(row.payment_due_days_left) : undefined,
    paymentStatus: normalizePaymentStatus(row.payment_status),
    refundReason: row.refund_reason || undefined,
    refundReference: row.refund_reference || undefined,
    refundedAt: row.refunded_at || undefined,
    landlordId: row.landlord_id || undefined
  };
}

export const mapBookingRowToBooking = mapRowToBooking;

export function mapBookingToDbPayload(booking: Partial<Booking> & Record<string, any>): Record<string, any> {
  const rawDate = booking.preferredDate || booking.startDate || booking.preferred_date || booking.start_date;
  const normalizedPreferredDate = normalizeDateToYYYYMMDD(rawDate) || new Date().toISOString().split('T')[0];

  const rawTime = booking.preferredTime || booking.preferred_time || (booking as any).tourTimeSlot;
  const normalizedPreferredTime = normalizeTimeToHHMM(rawTime) || '10:30';

  const rawStartDate = booking.startDate || booking.preferredDate || booking.start_date || booking.preferred_date;
  const normalizedStartDate = normalizeDateToYYYYMMDD(rawStartDate) || normalizedPreferredDate;

  const rawEndDate = booking.endDate || booking.end_date;
  const normalizedEndDate = normalizeDateToYYYYMMDD(rawEndDate) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const propertyId = booking.propertyId || booking.property_id || booking.listingId || booking.listing_id;
  const userId = booking.userId || booking.user_id || booking.guestId || booking.guest_id;
  const userName = booking.userName || booking.user_name || booking.guestName || booking.guest_name;
  const userEmail = booking.userEmail || booking.user_email || booking.guestEmail || booking.guest_email;
  const userPhone = booking.userPhone || booking.user_phone || (booking as any).guestPhone || (booking as any).guest_phone || null;

  const payload: Record<string, any> = {
    property_id: propertyId,
    listing_id: propertyId,
    listing_title: booking.listingTitle || booking.listing_title || null,
    listing_image: booking.listingImage || booking.listing_image || null,
    listing_price: booking.listingPrice != null ? Number(booking.listingPrice) : (booking.listing_price != null ? Number(booking.listing_price) : null),
    user_id: userId,
    guest_id: userId,
    user_name: userName || null,
    guest_name: userName || null,
    user_email: userEmail || null,
    guest_email: userEmail || null,
    user_phone: userPhone || null,
    landlord_id: booking.landlordId || booking.landlord_id || null,
    start_date: normalizedStartDate,
    end_date: normalizedEndDate,
    preferred_date: normalizedPreferredDate,
    preferred_time: normalizedPreferredTime,
    total_amount: booking.totalAmount != null ? Number(booking.totalAmount) : (booking.total_amount != null ? Number(booking.total_amount) : (booking.listingPrice != null ? Number(booking.listingPrice) : 0)),
    total_price: booking.totalAmount != null ? Number(booking.totalAmount) : (booking.total_price != null ? Number(booking.total_price) : (booking.listingPrice != null ? Number(booking.listingPrice) : 0)),
    status: normalizeBookingStatus(booking.status),
    billing_cycle: booking.billingCycle || booking.billing_cycle || 'monthly',
    lease_signed_name: booking.leaseSignedName || booking.lease_signed_name || null,
    lease_signed_date: booking.leaseSignedDate || booking.lease_signed_date || null,
    payment_method: booking.paymentMethod || booking.payment_method || null,
    payment_reference: booking.paymentReference || booking.payment_reference || null,
    payment_status: booking.paymentStatus || booking.payment_status || 'unpaid',
    next_payment_due_date: booking.nextPaymentDueDate || booking.next_payment_due_date || null,
    payment_due_days_left: booking.paymentDueDaysLeft != null ? Number(booking.paymentDueDaysLeft) : (booking.payment_due_days_left != null ? Number(booking.payment_due_days_left) : null),
    refund_reason: booking.refundReason || booking.refund_reason || null,
    refund_reference: booking.refundReference || booking.refund_reference || null,
    refunded_at: booking.refundedAt || booking.refunded_at || null,
    messages: Array.isArray(booking.messages) ? booking.messages : []
  };

  return payload;
}

export const mapBookingToInsert = mapBookingToDbPayload;

/**
 * Maps partial updates to column key-values without overriding unspecified columns or protected financial fields.
 */
export function mapBookingUpdatesToDbPayload(updates: Partial<Booking> & Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};

  if (updates.status !== undefined) payload.status = normalizeBookingStatus(updates.status);
  if (updates.preferredDate !== undefined || updates.preferred_date !== undefined) {
    payload.preferred_date = normalizeDateToYYYYMMDD(updates.preferredDate || updates.preferred_date);
  }
  if (updates.preferredTime !== undefined || updates.preferred_time !== undefined) {
    payload.preferred_time = normalizeTimeToHHMM(updates.preferredTime || updates.preferred_time);
  }
  if (updates.startDate !== undefined || updates.start_date !== undefined) {
    payload.start_date = normalizeDateToYYYYMMDD(updates.startDate || updates.start_date);
  }
  if (updates.endDate !== undefined || updates.end_date !== undefined) {
    payload.end_date = normalizeDateToYYYYMMDD(updates.endDate || updates.end_date);
  }
  if (updates.billingCycle !== undefined || updates.billing_cycle !== undefined) {
    payload.billing_cycle = updates.billingCycle || updates.billing_cycle;
  }
  if (updates.leaseSignedName !== undefined || updates.lease_signed_name !== undefined) {
    payload.lease_signed_name = updates.leaseSignedName ?? updates.lease_signed_name;
  }
  if (updates.leaseSignedDate !== undefined || updates.lease_signed_date !== undefined) {
    payload.lease_signed_date = updates.leaseSignedDate ?? updates.lease_signed_date;
  }
  if (updates.nextPaymentDueDate !== undefined || updates.next_payment_due_date !== undefined) {
    payload.next_payment_due_date = updates.nextPaymentDueDate ?? updates.next_payment_due_date;
  }
  if (updates.paymentDueDaysLeft !== undefined || updates.payment_due_days_left !== undefined) {
    payload.payment_due_days_left = updates.paymentDueDaysLeft ?? updates.payment_due_days_left;
  }
  if (updates.messages !== undefined) {
    payload.messages = updates.messages;
  }

  return payload;
}

/**
 * Fetch all bookings from Supabase.
 * Strictly queries Supabase and does not rely on local storage.
 */
export async function getBookings(filter?: { guestId?: string; userId?: string; propertyId?: string; listingId?: string }): Promise<Booking[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      // Protected data under RLS: do not query bookings if unauthenticated
      return [];
    }

    let query = supabase.from('bookings').select('*');

    const targetUserId = filter?.userId || filter?.guestId;
    if (targetUserId) {
      query = query.or(`user_id.eq.${targetUserId},guest_id.eq.${targetUserId}`);
    }

    const targetPropertyId = filter?.propertyId || filter?.listingId;
    if (targetPropertyId) {
      query = query.or(`property_id.eq.${targetPropertyId},listing_id.eq.${targetPropertyId}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      // If permission denied under RLS, return empty array gracefully
      if (error.code === '42501') {
        console.warn('Supabase getBookings RLS notice: user does not have permission to view all bookings.');
        return [];
      }
      console.error('Supabase getBookings error:', error);
      return [];
    }

    if (!data) return [];
    return data.map(mapRowToBooking);
  } catch (err: any) {
    console.error('getBookings error:', err);
    return [];
  }
}

/**
 * Fetch a single booking by its unique booking ID.
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  if (!supabase || !bookingId) return null;
  try {
    const cleanId = String(bookingId).trim();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    if (error) {
      console.error(`Supabase getBookingById error (${cleanId}):`, error);
      return null;
    }
    if (!data) return null;
    return mapRowToBooking(data);
  } catch (err) {
    console.error('getBookingById error:', err);
    return null;
  }
}

/**
 * Approves a specific booking by its unique booking ID.
 * Follows strict authentication check, UUID validation, and updates ONLY status: 'approved'.
 * Does NOT touch user_id, guest_id, or property_id.
 */
export async function approveBooking(bookingId: string): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData?.user) {
    throw new Error('Authentication required');
  }

  if (!bookingId || typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new Error('Booking ID is required.');
  }

  const cleanId = bookingId.trim();

  if (!isValidUUID(cleanId)) {
    throw new Error('Invalid booking ID format. Expected a valid UUID.');
  }

  // Update existing booking directly using booking.id
  // DO NOT include user_id, guest_id, property_id, or landlord_id in the UPDATE payload
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'approved'
    })
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error('Booking approval failed:', error);
    throw new Error(error.message || 'Booking approval failed.');
  }

  if (!data) {
    throw new Error('Booking not found or could not be updated.');
  }

  return mapRowToBooking(data);
}

/**
 * Rejects a specific booking by its unique booking ID.
 * Updates ONLY status: 'rejected' without modifying user_id or guest_id.
 */
export async function rejectBooking(bookingId: string, reason?: string): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData?.user) {
    throw new Error('Authentication required');
  }

  if (!bookingId || typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new Error('Booking ID is required.');
  }

  const cleanId = bookingId.trim();

  if (!isValidUUID(cleanId)) {
    throw new Error('Invalid booking ID format. Expected a valid UUID.');
  }

  const updatePayload: Record<string, any> = {
    status: 'rejected'
  };
  if (reason) {
    updatePayload.refund_reason = reason;
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error('Booking rejection failed:', error);
    throw new Error(error.message || 'Booking rejection failed.');
  }

  if (!data) {
    throw new Error('Booking not found or could not be updated.');
  }

  return mapRowToBooking(data);
}

/**
 * Cancels a specific booking by its unique booking ID.
 * Updates ONLY status: 'cancelled' without modifying user_id or guest_id.
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData?.user) {
    throw new Error('Authentication required');
  }

  if (!bookingId || typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new Error('Booking ID is required.');
  }

  const cleanId = bookingId.trim();

  if (!isValidUUID(cleanId)) {
    throw new Error('Invalid booking ID format. Expected a valid UUID.');
  }

  const updatePayload: Record<string, any> = {
    status: 'cancelled'
  };
  if (reason) {
    updatePayload.refund_reason = reason;
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error('Booking cancellation failed:', error);
    throw new Error(error.message || 'Booking cancellation failed.');
  }

  if (!data) {
    throw new Error('Booking not found or could not be updated.');
  }

  return mapRowToBooking(data);
}

/**
 * Create a new booking / rental application directly in Supabase.
 * Requires authenticated Supabase user and validates preferred_date and preferred_time.
 */
export async function createBooking(
  bookingData: (Omit<Booking, 'id' | 'createdAt' | 'propertyId' | 'userId' | 'userName' | 'userEmail'> & {
    propertyId?: string;
    listingId?: string;
    userId?: string;
    guestId?: string;
    userName?: string;
    guestName?: string;
    userEmail?: string;
    guestEmail?: string;
    userPhone?: string;
    status?: Booking['status'];
    preferredDate?: string;
    preferredTime?: string;
    preferred_date?: string;
    preferred_time?: string;
  })
): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  // 1. Require authenticated Supabase user
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    throw new Error('Authentication required: You must be signed in to book a property.');
  }

  const user = authData.user;
  const userId = user.id;
  const userEmail = user.email || bookingData.userEmail || bookingData.guestEmail || '';
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || bookingData.userName || bookingData.guestName || 'Tenant';
  const userPhone = user.user_metadata?.phone || user.phone || bookingData.userPhone || null;

  const rawDate = bookingData.preferredDate || bookingData.startDate || (bookingData as any).preferred_date || (bookingData as any).start_date;
  const normalizedPreferredDate = normalizeDateToYYYYMMDD(rawDate);

  if (!normalizedPreferredDate) {
    throw new Error('Please select your preferred date.');
  }

  const rawTime = bookingData.preferredTime || (bookingData as any).preferred_time || (bookingData as any).tourTimeSlot;
  const normalizedPreferredTime = normalizeTimeToHHMM(rawTime);

  if (!normalizedPreferredTime) {
    throw new Error('Please select your preferred time.');
  }

  const propertyId = bookingData.propertyId || bookingData.listingId || (bookingData as any).property_id || (bookingData as any).listing_id;
  if (!propertyId) {
    throw new Error('Property ID is required.');
  }

  const rawEndDate = bookingData.endDate || (bookingData as any).end_date;
  const normalizedEndDate = normalizeDateToYYYYMMDD(rawEndDate) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const payload = mapBookingToDbPayload({
    ...bookingData,
    propertyId,
    listingId: propertyId,
    userId,
    guestId: userId,
    userName,
    guestName: userName,
    userEmail,
    guestEmail: userEmail,
    userPhone: userPhone || undefined,
    status: bookingData.status || 'pending',
    startDate: normalizedPreferredDate,
    endDate: normalizedEndDate,
    preferredDate: normalizedPreferredDate,
    preferredTime: normalizedPreferredTime
  });

  const { data, error } = await supabase
    .from('bookings')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase createBooking error:', error);
    throw new Error(error.message || 'Failed to save booking to Supabase.');
  }

  if (!data) {
    throw new Error('No booking data returned from database.');
  }

  return mapRowToBooking(data);
}

/**
 * Update a booking status or details in Supabase.
 */
export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error('Booking ID is required.');
  }

  const cleanId = id.trim();

  // If status is specifically approved with no extra fields, delegate to approveBooking
  if (updates.status === 'approved' && Object.keys(updates).length === 1) {
    return approveBooking(cleanId);
  }

  // If status is specifically rejected with no extra fields, delegate to rejectBooking
  if (updates.status === 'rejected' && Object.keys(updates).length === 1) {
    return rejectBooking(cleanId);
  }

  // If status is specifically cancelled with no extra fields, delegate to cancelBooking
  if (updates.status === 'cancelled' && Object.keys(updates).length === 1) {
    return cancelBooking(cleanId);
  }

  const { data: existingBooking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();

  if (fetchErr) {
    console.error(`Supabase fetch booking error (${cleanId}):`, fetchErr);
    throw new Error(fetchErr.message || 'Error fetching booking.');
  }
  if (!existingBooking) {
    throw new Error('Booking not found.');
  }

  const payload = mapBookingUpdatesToDbPayload(updates);

  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error(`Supabase updateBooking error (${cleanId}):`, error);
    throw new Error(error.message || 'Failed to update booking in Supabase.');
  }

  const { data: refreshedBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();

  return mapRowToBooking(refreshedBooking || data);
}

/**
 * Delete a booking from Supabase.
 */
export async function deleteBooking(id: string): Promise<void> {
  if (!supabase || !id) return;
  const cleanId = String(id).trim();

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', cleanId);

  if (error) {
    console.error(`Supabase deleteBooking error (${cleanId}):`, error);
    throw new Error(error.message || 'Failed to delete booking from Supabase.');
  }
}

/**
 * Add a message to a booking's conversation thread in Supabase.
 */
export async function addBookingMessage(
  bookingId: string,
  message: {
    id?: string;
    senderId: string;
    senderName: string;
    senderRole?: 'guest' | 'landlord';
    text: string;
    timestamp?: string;
    isSystemNotice?: boolean;
  }
): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanId = String(bookingId).trim();

  const { data: bookingData, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();

  if (fetchErr || !bookingData) {
    throw new Error(fetchErr?.message || 'Booking not found.');
  }

  const existingMessages = Array.isArray(bookingData.messages) ? bookingData.messages : [];
  const newMessage: BookingMessage = {
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderId: message.senderId,
    senderName: message.senderName,
    senderRole: message.senderRole,
    text: message.text,
    createdAt: message.timestamp || new Date().toISOString(),
    timestamp: message.timestamp || new Date().toISOString(),
    isSystemNotice: !!message.isSystemNotice
  };

  const updatedMessages = [...existingMessages, newMessage];

  const { data, error } = await supabase
    .from('bookings')
    .update({ messages: updatedMessages })
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error(`Supabase addBookingMessage error (${cleanId}):`, error);
    throw new Error(error.message || 'Failed to send message.');
  }

  return mapRowToBooking(data);
}

/**
 * Confirm booking payment and digital lease signing directly in Supabase.
 */
export async function confirmBookingPayment(
  bookingId: string,
  leaseSignedName: string,
  paymentMethod: 'safepay' | 'paystack',
  paymentReference?: string
): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanId = String(bookingId).trim();

  const { data: currentData, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();

  if (fetchErr || !currentData) {
    throw new Error(fetchErr?.message || 'Booking not found.');
  }

  const existingMessages = Array.isArray(currentData.messages) ? currentData.messages : [];
  const systemNotice: BookingMessage = {
    id: `msg-sys-${Date.now()}`,
    senderId: 'system',
    senderName: 'Rentora Escrow & Trust',
    senderRole: 'landlord',
    text: `Payment confirmed via ${paymentMethod.toUpperCase()} (Ref: ${paymentReference || 'Direct-Escrow'}). Digital lease countersigned by ${leaseSignedName}.`,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    isSystemNotice: true
  };

  const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bookings')
    .update({
      lease_signed_name: leaseSignedName,
      lease_signed_date: new Date().toISOString(),
      messages: [...existingMessages, systemNotice]
    })
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error(`Supabase confirmBookingPayment error (${cleanId}):`, error);
    throw new Error(error.message || 'Failed to update digital lease signature.');
  }

  return mapRowToBooking(data);
}

/**
 * Process a booking refund in Supabase.
 */
export async function refundBooking(
  bookingId: string,
  reason: string,
  refundReference: string
): Promise<Booking> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanId = String(bookingId).trim();

  const { data: currentData, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();

  if (fetchErr || !currentData) {
    throw new Error(fetchErr?.message || 'Booking not found.');
  }

  const existingMessages = Array.isArray(currentData.messages) ? currentData.messages : [];
  const systemNotice: BookingMessage = {
    id: `msg-sys-refund-${Date.now()}`,
    senderId: 'system',
    senderName: 'Rentora Escrow & Trust',
    senderRole: 'landlord',
    text: `Refund executed: ${reason}. Escrow release transaction: ${refundReference}. Funds returned to original payment source.`,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    isSystemNotice: true
  };

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'rejected',
      refund_reason: reason,
      refund_reference: refundReference,
      refunded_at: new Date().toISOString(),
      messages: [...existingMessages, systemNotice]
    })
    .eq('id', cleanId)
    .select()
    .single();

  if (error) {
    console.error(`Supabase refundBooking error (${cleanId}):`, error);
    throw new Error(error.message || 'Failed to process refund in database.');
  }

  return mapRowToBooking(data);
}

/**
 * Get review for booking.
 */
export async function getReviewForBooking(bookingId: string): Promise<any | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

