import { supabase } from './supabaseClient';
import { FavoriteRow } from '../types';

export function mapRowToFavorite(row: Partial<FavoriteRow> & Record<string, any>): string {
  return String(row.property_id || row.listing_id || '');
}

export const mapFavoriteRowToFavorite = mapRowToFavorite;

/**
 * Fetch favorite property IDs for a specific user from Supabase.
 */
export async function getFavorites(userId?: string): Promise<string[]> {
  if (!supabase) return [];
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId) return [];
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', effectiveUserId);

    if (error) {
      console.error('Supabase getFavorites error:', error);
      return [];
    }

    return (data || []).map(mapRowToFavorite).filter(Boolean);
  } catch (err) {
    console.error('getFavorites error:', err);
    return [];
  }
}

/**
 * Add a property to user favorites in Supabase.
 */
export async function addFavorite(userId: string, propertyId: string): Promise<void> {
  if (!supabase) return;
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId || !propertyId) return;
  const { error } = await supabase
    .from('favorites')
    .upsert({
      user_id: effectiveUserId,
      property_id: propertyId,
      listing_id: propertyId
    }, { onConflict: 'user_id,property_id' });

  if (error) {
    console.error('Supabase addFavorite error:', error);
    throw new Error(error.message || 'Failed to save favorite.');
  }
}

/**
 * Remove a property from user favorites in Supabase.
 */
export async function removeFavorite(userId: string, propertyId: string): Promise<void> {
  if (!supabase) return;
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId || !propertyId) return;
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', effectiveUserId)
    .or(`property_id.eq.${propertyId},listing_id.eq.${propertyId}`);

  if (error) {
    console.error('Supabase removeFavorite error:', error);
    throw new Error(error.message || 'Failed to remove favorite.');
  }
}

/**
 * Toggle favorite status for a property in Supabase.
 * Returns true if added, false if removed.
 */
export async function toggleFavorite(userId: string, propertyId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId || !propertyId) return false;
  
  const existing = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', effectiveUserId)
    .or(`property_id.eq.${propertyId},listing_id.eq.${propertyId}`)
    .maybeSingle();

  if (existing.data) {
    await removeFavorite(effectiveUserId, propertyId);
    return false;
  } else {
    await addFavorite(effectiveUserId, propertyId);
    return true;
  }
}
