import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User } from '../types';
import { registerUser, login, logout } from './store';

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
 * Sign up user with Supabase Auth & create/sync profile
 */
export async function signUpWithSupabase(params: SignUpParams): Promise<User> {
  const defaultPassword = params.password || 'RentoraPass2026!';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: defaultPassword,
        options: {
          data: {
            full_name: params.name,
            role: params.role,
            phone: params.phone,
            country: params.country,
            city: params.city,
            state: params.state,
          },
        },
      });

      if (error) {
        console.warn('Supabase auth signUp warning:', error.message);
      } else if (data.user) {
        // Upsert metadata profile in public.profiles table
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: params.email,
            full_name: params.name,
            phone: params.phone || null,
            role: params.role,
            country: params.country || 'Nigeria',
            state: params.state || null,
            city: params.city || null,
            street_address: params.streetAddress || null,
            preferred_move_in_region: params.preferredMoveInRegion || null,
          }, { onConflict: 'id' });
        } catch (profileErr) {
          console.warn('Profile sync warning:', profileErr);
        }
      }
    } catch (err) {
      console.warn('Supabase signUp error, falling back to local store register:', err);
    }
  }

  // Register in local store for immediate UI reactivity
  const localUser = registerUser({
    name: params.name,
    email: params.email,
    role: params.role,
    phone: params.phone,
    country: params.country,
    state: params.state,
    city: params.city,
    postalCode: params.postalCode,
    streetAddress: params.streetAddress,
    taxId: params.taxId,
    preferredMoveInRegion: params.preferredMoveInRegion,
  });

  return localUser;
}

/**
 * Log in user with Supabase Auth
 */
export async function loginWithSupabase(
  email: string,
  password?: string,
  role: 'guest' | 'landlord' = 'guest',
  name?: string
): Promise<User> {
  const defaultPassword = password || 'RentoraPass2026!';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: defaultPassword,
      });

      if (error) {
        console.warn('Supabase signInWithPassword warning:', error.message);
      } else if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          return login(profile.email, (profile.role as any) || role, profile.full_name || name);
        }
      }
    } catch (err) {
      console.warn('Supabase login error, falling back to local login:', err);
    }
  }

  // Fallback / sync local login
  return login(email, role, name);
}

/**
 * Log out user from Supabase Auth & clear local session
 */
export async function logoutWithSupabase(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
  }

  if (typeof logout === 'function') {
    logout();
  }
}

/**
 * Get current active user session from Supabase
 */
export async function getCurrentSupabaseUser(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      return {
        id: profile.id,
        name: profile.full_name || 'User',
        email: profile.email,
        role: profile.role || 'guest',
        phone: profile.phone,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        streetAddress: profile.street_address,
        preferredMoveInRegion: profile.preferred_move_in_region,
      };
    }
  } catch (err) {
    console.warn('getCurrentSupabaseUser error:', err);
  }

  return null;
}
