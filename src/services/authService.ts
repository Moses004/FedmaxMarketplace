import { supabase } from './supabaseClient';
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
 * Sign up user with Supabase Auth.
 * The database trigger (on_auth_user_created -> handle_new_user) automatically creates
 * public.profiles from auth.users and user metadata.
 * If email confirmation is enabled, session is null and we must NOT call updateProfile()
 * from an unauthenticated client.
 */
export async function signUpWithSupabase(params: SignUpParams): Promise<User> {
  const password = params.password || 'RentoraPass2026!';
  const country = params.country || 'Nigeria';
  const state = params.state || '';
  const city = params.city || '';
  const region = deriveRegionFromLocation({ country, state, city });
  const dbRole = params.role === 'guest' ? 'tenant' : 'landlord';

  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: password,
    options: {
      data: {
        full_name: params.name.trim(),
        name: params.name.trim(),
        role: dbRole,
        phone: params.phone,
        country: country,
        region: region,
        city: city,
        state: state,
        postal_code: params.postalCode,
        street_address: params.streetAddress,
        tax_id: params.taxId,
        preferred_move_in_region: params.preferredMoveInRegion,
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

  // If email confirmation is enabled and session is null (auth.uid() is NULL in DB),
  // DO NOT write to public.profiles from unauthenticated client.
  // The database trigger handles initial profile insertion in SECURITY DEFINER context.
  if (!data.session) {
    return {
      id: data.user.id,
      name: params.name.trim(),
      email: params.email.trim(),
      role: params.role,
      phone: params.phone,
      country,
      region,
      state,
      city,
      postalCode: params.postalCode,
      streetAddress: params.streetAddress,
      taxId: params.taxId,
      preferredMoveInRegion: params.preferredMoveInRegion,
    };
  }

  // If session is immediately established (email confirmation disabled or auto-confirmed):
  // Fetch the profile created by database trigger.
  let profile = await getProfile(data.user.id);
  if (!profile) {
    // Brief delay to allow trigger to finish
    await new Promise((resolve) => setTimeout(resolve, 300));
    profile = await getProfile(data.user.id);
  }

  if (profile) {
    return profile;
  }

  // Fallback: If trigger did not create profile and user is authenticated, updateProfile will succeed under RLS
  try {
    return await updateProfile(data.user.id, {
      name: params.name.trim(),
      email: params.email.trim(),
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
  } catch (profileErr) {
    console.warn('Could not write profile directly; returning user state:', profileErr);
    return {
      id: data.user.id,
      name: params.name.trim(),
      email: params.email.trim(),
      role: params.role,
      phone: params.phone,
      country,
      region,
      state,
      city,
      postalCode: params.postalCode,
      streetAddress: params.streetAddress,
      taxId: params.taxId,
      preferredMoveInRegion: params.preferredMoveInRegion,
    };
  }
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

  // If profile doesn't exist yet, bootstrap it from user metadata under authenticated session
  if (!profile) {
    const rawRole = (data.user.user_metadata?.role || role).toLowerCase();
    const userRole: 'guest' | 'landlord' = rawRole === 'landlord' ? 'landlord' : 'guest';
    const country = data.user.user_metadata?.country || 'Nigeria';
    const state = data.user.user_metadata?.state || '';
    const city = data.user.user_metadata?.city || '';
    const region = data.user.user_metadata?.region || deriveRegionFromLocation({ country, state, city });

    try {
      profile = await updateProfile(data.user.id, {
        name: name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Rentora User',
        email: data.user.email || email,
        role: userRole,
        phone: data.user.user_metadata?.phone,
        country,
        region,
        state,
        city,
      });
    } catch (profileErr) {
      console.warn('Could not bootstrap profile in loginWithSupabase:', profileErr);
      profile = {
        id: data.user.id,
        name: name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Rentora User',
        email: data.user.email || email,
        role: userRole,
        phone: data.user.user_metadata?.phone,
        country,
        region,
        state,
        city,
      };
    }
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
      const rawRole = (user.user_metadata?.role || 'tenant').toLowerCase();
      const userRole: 'guest' | 'landlord' = rawRole === 'landlord' ? 'landlord' : 'guest';
      const country = user.user_metadata?.country || 'Nigeria';
      const state = user.user_metadata?.state || '';
      const city = user.user_metadata?.city || '';
      const region = user.user_metadata?.region || deriveRegionFromLocation({ country, state, city });

      try {
        profile = await updateProfile(user.id, {
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Rentora User',
          email: user.email || '',
          role: userRole,
          phone: user.user_metadata?.phone,
          country,
          region,
          state,
          city,
        });
      } catch (profileErr) {
        console.warn('Could not bootstrap profile in getCurrentSupabaseUser:', profileErr);
        profile = {
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Rentora User',
          email: user.email || '',
          role: userRole,
          phone: user.user_metadata?.phone,
          country,
          region,
          state,
          city,
        };
      }
    }

    return profile;
  } catch (err) {
    console.error('getCurrentSupabaseUser error:', err);
    return null;
  }
}
