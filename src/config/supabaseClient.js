import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// This identifies if we are yummys or pantry-co
const brandID = import.meta.env.VITE_BRAND || 'default-brand';

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      // THIS IS THE FIX: It creates a separate storage slot for each brand
      storageKey: `sb-${brandID}-auth-token`, 
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: { 'x-brand-id': brandID }
    }
  }
);