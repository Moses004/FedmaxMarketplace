import { supabase } from './supabaseClient';
import { User } from '../types';
import { getProfile, updateProfile } from './profileService';
import { deriveRegionFromLocation } from '../utils/location';

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
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
  const cleanEmail = (params.email || '').trim();
  const password = (params.password || '').trim();

  if (!cleanEmail) {
    throw new Error('Email address is required.');
  }
  if (!password) {
    throw new Error('Password is required.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const country = params.country || 'Nigeria';
  const state = params.state || '';
  const city = params.city || '';
  const region = deriveRegionFromLocation({ country, state, city });
  const dbRole = params.role === 'guest' ? 'tenant' : 'landlord';

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
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
  password: string,
  role: 'guest' | 'landlord' = 'guest',
  name?: string
): Promise<User> {
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || process.env.NODE_ENV !== 'production';
  const cleanEmail = (email || '').trim();
  const loginPassword = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Email address is required.');
  }
  if (!loginPassword) {
    throw new Error('Password is required.');
  }

  // Development-only logging: Supabase URL and request start (DO NOT log password, tokens, or anon key)
  if (isDev) {
    const sbUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://wctefjuoemcqhruzuicc.supabase.co';
    console.log('[Supabase Auth] Request start -> URL:', sbUrl, '| Email:', cleanEmail);
  }

  // 1. AUTHENTICATION: Authenticate via Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: loginPassword,
  });

  // Development-only logging: Response status
  if (isDev) {
    console.log('[Supabase Auth] Response status ->', error ? 'Error' : 'Success', {
      hasUser: Boolean(data?.user),
      hasSession: Boolean(data?.session),
      errorMessage: error?.message,
      errorCode: error?.code || (error as any)?.status,
    });
  }

  // Error handling: Capture actual Supabase error
  if (error) {
    if (isDev) {
      console.error('[Supabase Auth] Authentication error:', error);
    }

    if (error.message?.toLowerCase().includes('failed to fetch')) {
      throw new Error(
        'Unable to connect to the authentication server. Please check your internet connection and try again.'
      );
    } else {
      throw new Error(formatAuthErrorMessage(error));
    }
  }

  if (!data?.user) {
    throw new Error('Login failed: No user returned by authentication provider.');
  }

  // 2. AUTH SESSION: Verify session creation
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isDev && session) {
    console.log('[Supabase Auth] Session established for user ID:', session.user?.id);
  }

  // 3. PROFILE LOADING: Strictly separated from authentication using user.id from Supabase Auth
  // A failure loading a profile must NOT be reported as an authentication failure.
  let profile: User | null = null;
  try {
    profile = await getProfile(data.user.id);
  } catch (profileErr) {
    console.warn('[Supabase Auth] Profile load non-fatal warning:', profileErr);
  }

  // If profile doesn't exist yet, bootstrap or build graceful fallback from user metadata
  if (!profile) {
    const rawRole = (data.user.user_metadata?.role || role || 'tenant').toLowerCase();
    const userRole: 'guest' | 'landlord' = rawRole === 'landlord' ? 'landlord' : 'guest';
    const country = data.user.user_metadata?.country || 'Nigeria';
    const state = data.user.user_metadata?.state || '';
    const city = data.user.user_metadata?.city || '';
    const region = data.user.user_metadata?.region || deriveRegionFromLocation({ country, state, city });

    const fallbackUser: User = {
      id: data.user.id,
      name: name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Rentora User',
      fullName: name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Rentora User',
      email: data.user.email || cleanEmail,
      role: userRole,
      phone: data.user.user_metadata?.phone,
      country,
      region,
      state,
      city,
      preferredMoveInRegion: data.user.user_metadata?.preferred_move_in_region,
      taxId: data.user.user_metadata?.tax_id,
    };

    try {
      profile = await updateProfile(data.user.id, {
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: userRole,
        phone: fallbackUser.phone,
        country,
        region,
        state,
        city,
      });
    } catch (bootstrapErr) {
      console.warn('[Supabase Auth] Could not persist profile row; proceeding with authenticated session state:', bootstrapErr);
      profile = fallbackUser;
    }
  }

  return profile || {
    id: data.user.id,
    name: name || data.user.email?.split('@')[0] || 'Rentora User',
    fullName: name || data.user.email?.split('@')[0] || 'Rentora User',
    email: data.user.email || cleanEmail,
    role: role,
    country: 'Nigeria',
    region: 'South West',
    state: 'Lagos State',
    city: 'Lagos',
  };
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return null;
    }
    const user = session.user;

    let profile = await getProfile(user.id);
    if (!profile) {
      const meta = user.user_metadata || {};
      const rawRole = (meta.role || 'tenant').toLowerCase();
      const userRole: 'guest' | 'landlord' = rawRole === 'landlord' ? 'landlord' : 'guest';
      const country = meta.country || 'Nigeria';
      const state = meta.state || '';
      const city = meta.city || '';
      const region = meta.region || deriveRegionFromLocation({ country, state, city });

      const fallbackUser: User = {
        id: user.id,
        name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Rentora User',
        fullName: meta.full_name || meta.name || user.email?.split('@')[0] || 'Rentora User',
        email: user.email || '',
        role: userRole,
        phone: meta.phone,
        country,
        region,
        state,
        city,
        preferredMoveInRegion: meta.preferred_move_in_region,
        taxId: meta.tax_id,
      };

      try {
        profile = await updateProfile(user.id, {
          name: fallbackUser.name,
          email: fallbackUser.email,
          role: userRole,
          phone: fallbackUser.phone,
          country,
          region,
          state,
          city,
        });
      } catch (profileErr) {
        console.warn('Could not bootstrap profile in getCurrentSupabaseUser:', profileErr);
        profile = fallbackUser;
      }
    }

    return profile;
  } catch (err) {
    console.error('getCurrentSupabaseUser error:', err);
    return null;
  }
}

/**
 * Format authentication error messages to prevent generic 'Failed to fetch' and provide actionable user feedback.
 */
export function formatAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const raw = typeof error === 'string' ? error : (error.message || '');
  const lower = raw.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant') || lower.includes('wrong password')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('invalid email') || lower.includes('valid email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('passwords do not match')) {
    return 'Passwords do not match.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the verification link.';
  }
  if (lower.includes('user not found')) {
    return 'If an account exists for this email address, you will receive a password reset link shortly.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }
  if (lower.includes('password should be at least') || lower.includes('weak password')) {
    return 'Password must be at least 8 characters long.';
  }
  if (
    lower.includes('token has expired') || 
    lower.includes('session has expired') || 
    lower.includes('invalid token') || 
    lower.includes('missing access token') ||
    lower.includes('otp_expired') ||
    lower.includes('access_denied')
  ) {
    return 'This password reset link has expired. Please request a new reset link.';
  }
  if (lower.includes('same as old password') || lower.includes('different from the old password')) {
    return 'Your new password cannot be the same as your previous password.';
  }
  return raw || 'Authentication request failed. Please try again.';
}

export interface PasswordRequirements {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Validates:
 * - minimum 8 characters
 * - uppercase letter
 * - lowercase letter
 * - number
 * - special character
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password);

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  };
}

/**
 * Validate password complexity and return an error string if invalid.
 */
export function validatePasswordComplexity(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password)) {
    return 'Password must contain at least one special character (e.g. !@#$%^&*).';
  }
  return null;
}

/**
 * Resolves the primary application URL using VITE_APP_URL.
 * Production default strictly resolves to https://rentora.ai.studio.
 */
export function getAppUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) {
    return String(import.meta.env.VITE_APP_URL).trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.trim().replace(/\/+$/, '');
    if (!origin.includes('localhost')) {
      return origin;
    }
  }
  return 'https://rentora.ai.studio';
}

/**
 * Request password reset email using Supabase Auth.
 * Uses:
 * supabase.auth.resetPasswordForEmail(email, {
 *   redirectTo: `${APP_URL}/reset-password`
 * })
 */
export async function requestPasswordReset(email: string, redirectTo?: string): Promise<void> {
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || process.env.NODE_ENV !== 'production';
  const cleanEmail = (email || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  const appUrl = getAppUrl();
  const targetRedirectTo = redirectTo || `${appUrl}/reset-password`;

  if (isDev) {
    console.log('[Supabase Auth] Requesting password reset email for:', cleanEmail, 'with redirectTo:', targetRedirectTo);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: targetRedirectTo,
  });

  if (error) {
    if (isDev) {
      console.error('[Supabase Auth] resetPasswordForEmail error:', error);
    }
    throw error;
  }

  if (isDev) {
    console.log('[Supabase Auth] Password reset email sent successfully to:', cleanEmail);
  }
}

/**
 * Backward-compatible alias for requestPasswordReset
 */
export const sendPasswordResetEmail = requestPasswordReset;

/**
 * Update password using Supabase Auth for an authenticated recovery session.
 * Uses:
 * supabase.auth.updateUser({
 *   password
 * })
 */
export async function updatePassword(password: string): Promise<void> {
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || process.env.NODE_ENV !== 'production';
  const newPassword = (password || '').trim();
  
  if (!newPassword) {
    throw new Error('Please enter a new password.');
  }

  const complexityError = validatePasswordComplexity(newPassword);
  if (complexityError) {
    throw new Error(complexityError);
  }

  if (isDev) {
    console.log('[Supabase Auth] Updating user password via updateUser...');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    if (isDev) {
      console.error('[Supabase Auth] updateUser password error:', error);
    }
    throw new Error(formatAuthErrorMessage(error));
  }

  if (isDev) {
    console.log('[Supabase Auth] Password updated successfully for user:', data.user?.id);
  }
}

/**
 * Backward-compatible alias for updatePassword
 */
export const updateUserPassword = updatePassword;
