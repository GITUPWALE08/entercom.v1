import { createClient } from '@supabase/supabase-js';

// TODO: Add these to your .env file
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://bthvlmwzjwryepeugwqw.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aHZsbXd6andyeWVwZXVnd3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMjQ0NDMsImV4cCI6MjA5OTcwMDQ0M30.T5t7EGutdTQbZCYNGP1zcywbZfawHVHMG6md1FwXpvQ'
);
