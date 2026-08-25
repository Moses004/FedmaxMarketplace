import { supabase } from './supabaseClient';
import { User, ProfileRow } from '../types';
import { deriveRegionFromLocation } from '../utils/location';

export function mapRowToUserProfile(row: Partial<ProfileRow> & Record<string, any>): User {
  const country = row.country || '';
  const state = row.state || '';
  const city = row.city || '';
  const region = row.region || deriveRegionFromLocation({ country, state, city });
  const rawRole = (row.role || 'tenant').toLowerCase();
  const role: 'guest' | 'landlord' = rawRole === 'landlord' ? 'landlord' : 'guest';
  const name = row.full_name || row.name || 'Rentora User';

  return {
    id: String(row.id),
    name,
    fullName: name,
    email: row.email || '',
    role,
    phone: row.phone || undefined,
    country,
    region,
    state,
    city,
    postalCode: row.postal_code || undefined,
    streetAddress: row.street_address || undefined,
    taxId: row.tax_id || undefined,
    preferredMoveInRegion: row.preferred_move_in_region || undefined
  };
}

export const mapProfileRowToProfile = mapRowToUserProfile;

export function mapProfileToUpdate(updates: Partial<User>): Partial<ProfileRow> {
  const country = updates.country || '';
  const state = updates.state || '';
  const city = updates.city || '';
  const region = updates.region || deriveRegionFromLocation({ country, state, city });

  const payload: Partial<ProfileRow> & Record<string, any> = {};

  if (updates.name !== undefined || updates.fullName !== undefined) {
    const canonicalName = updates.fullName || updates.name || '';
    payload.name = canonicalName;
    payload.full_name = canonicalName;
  }
  if (updates.email !== undefined) payload.email = updates.email;
  // Role changes are strictly governed by backend auth / administrative functions
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.country !== undefined) payload.country = updates.country;
  if (updates.state !== undefined) payload.state = updates.state;
  if (updates.city !== undefined) payload.city = updates.city;
  payload.region = region;
  if (updates.postalCode !== undefined) payload.postal_code = updates.postalCode;
  if (updates.streetAddress !== undefined) payload.street_address = updates.streetAddress;
  if (updates.taxId !== undefined) payload.tax_id = updates.taxId;
  if (updates.preferredMoveInRegion !== undefined) payload.preferred_move_in_region = updates.preferredMoveInRegion;

  return payload;
}

/**
 * Fetch a user profile by user ID from Supabase public.profiles.
 */
export async function getProfile(userId: string): Promise<User | null> {
  if (!userId || !supabase) return null;

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
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId) {
    throw new Error('Authentication required: You must be logged in to update your profile.');
  }

  const payload = {
    id: effectiveUserId,
    ...mapProfileToUpdate(updates)
  };

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
