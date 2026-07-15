import { createClient } from '@supabase/supabase-js';

// Environment variables - these are embedded at build time by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if URL is valid to prevent crashes on placeholder configurations
const isValidUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const finalSupabaseUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : 'https://placeholder.supabase.co';
const finalSupabaseKey = supabaseAnonKey || 'placeholder';

// Create and export the Supabase client
// The env vars are hardcoded at build time, so this always works in production
export const supabase = createClient(
  finalSupabaseUrl,
  finalSupabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
