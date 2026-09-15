import { createClient, SupabaseClient } from '@supabase/supabase-js';

function parseJwtPayload(token?: string): any {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' 
      ? atob(base64) 
      : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Support environment variable names already used by the project
const rawUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  process.env.VITE_SUPABASE_URL || 
  'https://wctefjuoemcqhruzuicc.supabase.co'
).trim();

const rawAnon = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  ''
).trim();

// Mandate: Strictly use the public anon/publishable key. NEVER use or expose service_role key in client.
export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawAnon;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || process.env.NODE_ENV !== 'production';

if (isDev && typeof window !== 'undefined') {
  console.log('[Supabase Client] Initialized project URL:', supabaseUrl);
}

// Exactly ONE Supabase client instance using standard browser session persistence
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helper function to retrieve the Supabase client safely.
 */
export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export default supabase;

/**
 * Helper function to check if a PostgREST error is caused by missing tables/schema cache (PGRST205 / 42P01).
 */
export function isPgrstSchemaCacheError(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('Could not find the table') ||
    (message.includes('relation') && message.includes('does not exist')) ||
    details.includes('schema cache')
  );
}
