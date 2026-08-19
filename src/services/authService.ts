import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User } from '../types';
import { getProfile, updateProfile } from './profileService';
import { deriveRegionFromLocation } from '../utils/location';

export interface SignUpParams {
  name: string;
  email: string;
  password?: string;
  role: 'guest' | 'landlord';
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  streetAddress?: string;
  taxId?: string;
  preferredMoveInRegion?: string;
}

/**
 * Sign up user with Supabase Auth, write public.profiles record, and return database user.
 */
export async function signUpWithSupabase(params: SignUpParams): Promise<User> {
  const password = params.password || 'RentoraPass2026!';
  const country = params.country || 'Nigeria';
  const state = params.state || '';
  const city = params.city || '';
  const region = deriveRegionFromLocation({ country, state, city });

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: password,
    options: {
      data: {
        full_name: params.name,
        role: params.role,
        phone: params.phone,
        country: country,
        region: region,
        city: city,
        state: state,
      },
    },
  });

  if (error) {
    console.error('Supabase auth signUp error:', error.message);
    throw new Error(error.message || 'Registration failed.');
  }

  if (!data.user) {
    throw new Error('Registration failed: No user returned by authentication provider.');
  }

  // Create/Update profile in public.profiles table
  const user = await updateProfile(data.user.id, {
    name: params.name,
    email: params.email,
    role: params.role,
    phone: params.phone,
    country: country,
    region: region,
    state: state,
    city: city,
    postalCode: params.postalCode,
    streetAddress: params.streetAddress,
    taxId: params.taxId,
    preferredMoveInRegion: params.preferredMoveInRegion,
  });

  return user;
}

/**
 * Log in user with Supabase Auth, load public.profiles record, and return authenticated user.
 */
export async function loginWithSupabase(
  email: string,
  password?: string,
  role: 'guest' | 'landlord' = 'guest',
  name?: string
): Promise<User> {
  const loginPassword = password || 'RentoraPass2026!';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: loginPassword,
  });

  if (error) {
    console.error('Supabase signInWithPassword error:', error.message);
    throw new Error(error.message || 'Invalid login credentials.');
  }

  if (!data.user) {
    throw new Error('Login failed: Unable to establish user session.');
  }

  // Load database profile
  let profile = await getProfile(data.user.id);

  // If profile doesn't exist yet, bootstrap it from user metadata
  if (!profile) {
    profile = await updateProfile(data.user.id, {
      name: name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Rentora User',
      email: data.user.email || email,
      role: (data.user.user_metadata?.role as any) || role,
      phone: data.user.user_metadata?.phone,
      country: data.user.user_metadata?.country || 'Nigeria',
      state: data.user.user_metadata?.state,
      city: data.user.user_metadata?.city,
    });
  }

  return profile;
}

/**
 * Log out user from Supabase Auth & terminate session.
 */
export async function logoutWithSupabase(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase signOut error:', error);
    throw new Error(error.message || 'Logout failed.');
  }
}

/**
 * Get current active user session and verified database profile from Supabase.
 */
export async function getCurrentSupabaseUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    let profile = await getProfile(user.id);
    if (!profile) {
      profile = await updateProfile(user.id, {
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'Rentora User',
        email: user.email || '',
        role: (user.user_metadata?.role as any) || 'guest',
        phone: user.user_metadata?.phone,
        country: user.user_metadata?.country || 'Nigeria',
        state: user.user_metadata?.state,
        city: user.user_metadata?.city,
      });
    }

    return profile;
  } catch (err) {
    console.error('getCurrentSupabaseUser error:', err);
    return null;
  }
}
