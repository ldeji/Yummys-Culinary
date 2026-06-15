import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This will tell us in the browser console exactly what is wrong
if (!supabaseUrl) console.error("DEBUG: VITE_SUPABASE_URL is missing!");
if (!supabaseAnonKey) console.error("DEBUG: VITE_SUPABASE_ANON_KEY is missing!");

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);