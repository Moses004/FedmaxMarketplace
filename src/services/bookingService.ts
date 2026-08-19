import { supabase } from './supabaseClient';
import { Booking } from '../types';

export function mapRowToBooking(row: any): Booking {
  return {
    id: String(row.id),
    listingId: String(row.listing_id || row.listingId || ''),
    listingTitle: row.listing_title || row.listingTitle || 'Rental Property',
    listingImage: row.listing_image || row.listingImage || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    listingPrice: Number(row.listing_price || row.listingPrice || 0),
    guestId: String(row.guest_id || row.guestId || ''),
    guestName: row.guest_name || row.guestName || 'Tenant',
    guestEmail: row.guest_email || row.guestEmail || '',
    startDate: row.start_date || row.startDate || new Date().toISOString().split('T')[0],
    endDate: row.end_date || row.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: (row.status || 'pending') as Booking['status'],
    totalAmount: Number(row.total_amount || row.totalAmount || 0),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    billingCycle: row.billing_cycle || row.billingCycle || 'annual',
    effectiveMonthlyPrice: row.effective_monthly_price != null ? Number(row.effective_monthly_price) : (row.effectiveMonthlyPrice != null ? Number(row.effectiveMonthlyPrice) : undefined),
    annualDiscountPercentage: Number(row.annual_discount_percentage || row.annualDiscountPercentage || 0),
    messages: Array.isArray(row.messages) ? row.messages : [],
    leaseSignedName: row.lease_signed_name || row.leaseSignedName || undefined,
    leaseSignedDate: row.lease_signed_date || row.leaseSignedDate || undefined,
    paymentMethod: row.payment_method || row.paymentMethod || undefined,
    paymentReference: row.payment_reference || row.paymentReference || undefined,
    nextPaymentDueDate: row.next_payment_due_date || row.nextPaymentDueDate || undefined,
    paymentDueDaysLeft: row.payment_due_days_left != null ? Number(row.payment_due_days_left) : undefined,
    paymentStatus: row.payment_status || row.paymentStatus || 'paid',
    refundReason: row.refund_reason || row.refundReason || undefined,
    refundReference: row.refund_reference || row.refundReference || undefined,
    refundedAt: row.refunded_at || row.refundedAt || undefined
  };
}

export function mapBookingToDbPayload(booking: Partial<Booking>) {
  return {
    listing_id: booking.listingId,
    listing_title: booking.listingTitle,
    listing_image: booking.listingImage,
    listing_price: booking.listingPrice != null ? Number(booking.listingPrice) : 0,
    guest_id: booking.guestId,
    guest_name: booking.guestName,
    guest_email: booking.guestEmail,
    start_date: booking.startDate,
    end_date: booking.endDate,
    status: booking.status || 'pending',
    total_amount: booking.totalAmount != null ? Number(booking.totalAmount) : 0,
    billing_cycle: booking.billingCycle || 'annual',
    effective_monthly_price: booking.effectiveMonthlyPrice != null ? Number(booking.effectiveMonthlyPrice) : null,
    annual_discount_percentage: booking.annualDiscountPercentage != null ? Number(booking.annualDiscountPercentage) : 0,
    messages: Array.isArray(booking.messages) ? booking.messages : [],
    lease_signed_name: booking.leaseSignedName || null,
    lease_signed_date: booking.leaseSignedDate || null,
    payment_method: booking.paymentMethod || null,
    payment_reference: booking.paymentReference || null,
    next_payment_due_date: booking.nextPaymentDueDate || null,
    payment_due_days_left: booking.paymentDueDaysLeft != null ? Number(booking.paymentDueDaysLeft) : null,
    payment_status: booking.paymentStatus || 'paid',
    refund_reason: booking.refundReason || null,
    refund_reference: booking.refundReference || null,
    refunded_at: booking.refundedAt || null
  };
}

/**
 * Fetch all bookings matching filter (guestId or general user session).
 */
export async function getBookings(filter?: { guestId?: string; listingId?: string }): Promise<Booking[]> {
  try {
    let query = supabase.from('bookings').select('*');

    if (filter?.guestId) {
      query = query.eq('guest_id', filter.guestId);
    }
    if (filter?.listingId) {
      query = query.eq('listing_id', filter.listingId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getBookings error:', error);
      throw new Error(error.message || 'Failed to fetch bookings from Supabase.');
    }

    if (!data) return [];
    return data.map(mapRowToBooking);
  } catch (err: any) {
    console.error('getBookings error:', err);
    throw err;
  }
}

/**
 * Create a new booking in Supabase.
 */
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'> & { status?: Booking['status'] }
): Promise<Booking> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const guestId = authData?.user?.id || bookingData.guestId;

  if (!guestId) {
    throw new Error('Authentication required: You must be signed in to book a property.');
  }

  const payload = mapBookingToDbPayload({
    ...bookingData,
    guestId
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

  return mapRowToBooking(data);
}

/**
 * Update booking status or payment/refund info in Supabase.
 */
export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking> {
  const payload = mapBookingToDbPayload(updates);

  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase updateBooking error (${id}):`, error);
    throw new Error(error.message || 'Failed to update booking in Supabase.');
  }

  return mapRowToBooking(data);
}

/**
 * Delete a booking from Supabase.
 */
export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase deleteBooking error (${id}):`, error);
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
    senderRole: 'guest' | 'landlord';
    text: string;
    timestamp?: string;
    isSystemNotice?: boolean;
  }
): Promise<Booking> {
  const { data: bookingData, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !bookingData) {
    throw new Error(fetchErr?.message || 'Booking not found');
  }

  const existingMessages = Array.isArray(bookingData.messages) ? bookingData.messages : [];
  const newMessage = {
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderId: message.senderId,
    senderName: message.senderName,
    senderRole: message.senderRole,
    text: message.text,
    timestamp: message.timestamp || new Date().toISOString(),
    isSystemNotice: !!message.isSystemNotice
  };

  const updatedMessages = [...existingMessages, newMessage];

  const { data, error } = await supabase
    .from('bookings')
    .update({ messages: updatedMessages })
    .eq('id', bookingId)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase addBookingMessage error (${bookingId}):`, error);
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
  const { data: currentData, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !currentData) {
    throw new Error(fetchErr?.message || 'Booking not found');
  }

  const existingMessages = Array.isArray(currentData.messages) ? currentData.messages : [];
  const systemNotice = {
    id: `msg-sys-${Date.now()}`,
    senderId: 'system',
    senderName: 'Rentora Escrow & Trust',
    senderRole: 'landlord' as const,
    text: `Payment of ${currentData.currency || 'USD'} ${(currentData.total_amount || 0).toLocaleString()} confirmed via ${paymentMethod.toUpperCase()} (Ref: ${paymentReference || 'Direct-Escrow'}). Digital lease countersigned by ${leaseSignedName}.`,
    timestamp: new Date().toISOString(),
    isSystemNotice: true
  };

  const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bookings')
    .update({
      lease_signed_name: leaseSignedName,
      lease_signed_date: new Date().toISOString(),
      payment_method: paymentMethod,
      payment_reference: paymentReference || `REF-${Date.now()}`,
      payment_status: 'paid',
      status: 'active',
      next_payment_due_date: nextDueDate,
      payment_due_days_left: 30,
      messages: [...existingMessages, systemNotice]
    })
    .eq('id', bookingId)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase confirmBookingPayment error (${bookingId}):`, error);
    throw new Error(error.message || 'Failed to confirm payment.');
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
  const { data: currentData, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !currentData) {
    throw new Error(fetchErr?.message || 'Booking not found');
  }

  const existingMessages = Array.isArray(currentData.messages) ? currentData.messages : [];
  const systemNotice = {
    id: `msg-sys-refund-${Date.now()}`,
    senderId: 'system',
    senderName: 'Rentora Escrow & Trust',
    senderRole: 'landlord' as const,
    text: `Refund executed: ${reason}. Escrow release transaction: ${refundReference}. Funds returned to original payment source.`,
    timestamp: new Date().toISOString(),
    isSystemNotice: true
  };

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'refunded',
      refund_reason: reason,
      refund_reference: refundReference,
      refunded_at: new Date().toISOString(),
      messages: [...existingMessages, systemNotice]
    })
    .eq('id', bookingId)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase refundBooking error (${bookingId}):`, error);
    throw new Error(error.message || 'Failed to process refund in database.');
  }

  return mapRowToBooking(data);
}

/**
 * Fetch review associated with a specific booking from Supabase.
 */
export async function getReviewForBooking(bookingId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: String(data.id),
      listingId: String(data.property_id || data.listing_id || ''),
      bookingId: String(data.booking_id || ''),
      guestId: String(data.guest_id || data.user_id || ''),
      guestName: data.guest_name || 'Verified Guest',
      rating: Number(data.rating || 5),
      comment: data.comment || '',
      createdAt: data.created_at || new Date().toISOString()
    };
  } catch {
    return null;
  }
}
