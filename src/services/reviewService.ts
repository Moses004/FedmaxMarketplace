import { supabase } from './supabaseClient';
import { PropertyReview, ReviewRow } from '../types';

export function mapRowToReview(row: Partial<ReviewRow> & Record<string, any>): PropertyReview {
  return {
    id: String(row.id),
    listingId: String(row.property_id || row.listing_id || ''),
    bookingId: String(row.booking_id || ''),
    guestId: String(row.guest_id || row.user_id || ''),
    guestName: row.guest_name || row.user_name || 'Verified Guest',
    rating: Number(row.rating || 5),
    comment: row.comment || '',
    createdAt: row.created_at || new Date().toISOString()
  };
}

export const mapReviewRowToReview = mapRowToReview;

export function mapReviewToDbPayload(review: Partial<PropertyReview>): Partial<ReviewRow> {
  return {
    property_id: review.listingId,
    listing_id: review.listingId,
    booking_id: review.bookingId || null,
    guest_id: review.guestId,
    guest_name: review.guestName || 'Verified Guest',
    rating: review.rating != null ? Number(review.rating) : 5,
    comment: review.comment || ''
  };
}

export const mapReviewToInsert = mapReviewToDbPayload;

/**
 * Fetch reviews for a specific property from Supabase.
 */
export async function getReviewsForProperty(propertyId: string): Promise<PropertyReview[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .or(`property_id.eq.${propertyId},listing_id.eq.${propertyId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getReviews error:', error);
      return [];
    }

    return (data || []).map(mapRowToReview);
  } catch (err) {
    console.error('getReviewsForProperty error:', err);
    return [];
  }
}

/**
 * Create a new property review in Supabase.
 */
export async function createReview(review: Omit<PropertyReview, 'id' | 'createdAt'>): Promise<PropertyReview> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const guestId = authData?.user?.id || review.guestId;
  const guestName = authData?.user?.user_metadata?.full_name || authData?.user?.user_metadata?.name || review.guestName;

  if (!guestId) {
    throw new Error('Authentication required: You must be signed in to submit a review.');
  }

  const payload = mapReviewToDbPayload({
    ...review,
    guestId,
    guestName
  });

  const { data, error } = await supabase
    .from('reviews')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase createReview error:', error);
    throw new Error(error.message || 'Failed to submit review to Supabase.');
  }

  return mapRowToReview(data);
}
