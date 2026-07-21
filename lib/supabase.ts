import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfkzyryotmsmevnweuws.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ma3p5cnlvdG1zbWV2bndldXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjM4MTksImV4cCI6MjA5Nzk5OTgxOX0.er7t42Dh7UkAN-Udda1dOMiXvpbylv8-RWyqXBDy6cA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
