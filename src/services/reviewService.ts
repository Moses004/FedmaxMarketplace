import { supabase } from './supabaseClient';
import { PropertyReview } from '../types';

export function mapRowToReview(row: any): PropertyReview {
  return {
    id: String(row.id),
    listingId: String(row.property_id || row.listing_id || row.listingId || ''),
    bookingId: String(row.booking_id || row.bookingId || ''),
    guestId: String(row.guest_id || row.user_id || row.guestId || ''),
    guestName: row.guest_name || row.guestName || 'Verified Guest',
    rating: Number(row.rating || 5),
    comment: row.comment || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

/**
 * Fetch reviews for a specific property from Supabase.
 */
export async function getReviewsForProperty(propertyId: string): Promise<PropertyReview[]> {
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
  const { data: authData } = await supabase.auth.getUser();
  const guestId = authData?.user?.id || review.guestId;
  const guestName = authData?.user?.user_metadata?.full_name || authData?.user?.user_metadata?.name || review.guestName;

  if (!guestId) {
    throw new Error('Authentication required: You must be signed in to submit a review.');
  }

  const payload = {
    property_id: review.listingId,
    listing_id: review.listingId,
    booking_id: review.bookingId,
    guest_id: guestId,
    guest_name: guestName || 'Verified Guest',
    rating: review.rating,
    comment: review.comment
  };

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
