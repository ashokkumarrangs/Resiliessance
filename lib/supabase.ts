import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️ Supabase environment variables are missing! ' +
      'If this is a build environment, ensure they are set in your dashboard. ' +
      'At runtime, this will cause service failures.'
    );
  }
}

// Using fallback strings to prevent createClient from throwing during build
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
