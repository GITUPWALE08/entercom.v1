import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bthvlmwzjwryepeugwqw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aHZsbXd6andyeWVwZXVnd3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMjQ0NDMsImV4cCI6MjA5OTcwMDQ0M30.T5t7EGutdTQbZCYNGP1zcywbZfawHVHMG6md1FwXpvQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
