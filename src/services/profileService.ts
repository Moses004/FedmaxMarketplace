import { supabase } from './supabaseClient';
import { User } from '../types';
import { deriveRegionFromLocation } from '../utils/location';

export function mapRowToUserProfile(row: any): User {
  const country = row.country || '';
  const state = row.state || '';
  const city = row.city || '';
  const region = row.region || deriveRegionFromLocation({ country, state, city });

  return {
    id: String(row.id),
    name: row.full_name || row.name || 'Rentora User',
    email: row.email || '',
    role: (row.role || 'guest') as 'guest' | 'landlord',
    phone: row.phone || undefined,
    country,
    region,
    state,
    city,
    postalCode: row.postal_code || row.postalCode || undefined,
    streetAddress: row.street_address || row.streetAddress || undefined,
    taxId: row.tax_id || row.taxId || undefined,
    preferredMoveInRegion: row.preferred_move_in_region || row.preferredMoveInRegion || undefined
  };
}

/**
 * Fetch a user profile by user ID from Supabase public.profiles.
 */
export async function getProfile(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase getProfile error:', error);
      return null;
    }

    if (!data) return null;
    return mapRowToUserProfile(data);
  } catch (err) {
    console.error('getProfile error:', err);
    return null;
  }
}

/**
 * Update a user profile in Supabase public.profiles table.
 */
export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }

  const country = updates.country || '';
  const state = updates.state || '';
  const city = updates.city || '';
  const region = updates.region || deriveRegionFromLocation({ country, state, city });

  const payload: any = {
    id: userId
  };

  if (updates.name !== undefined) payload.full_name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.country !== undefined) payload.country = updates.country;
  if (updates.state !== undefined) payload.state = updates.state;
  if (updates.city !== undefined) payload.city = updates.city;
  payload.region = region;
  if (updates.postalCode !== undefined) payload.postal_code = updates.postalCode;
  if (updates.streetAddress !== undefined) payload.street_address = updates.streetAddress;
  if (updates.taxId !== undefined) payload.tax_id = updates.taxId;
  if (updates.preferredMoveInRegion !== undefined) payload.preferred_move_in_region = updates.preferredMoveInRegion;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('Supabase updateProfile error:', error);
    throw new Error(error.message || 'Failed to update profile in database.');
  }

  return mapRowToUserProfile(data);
}
