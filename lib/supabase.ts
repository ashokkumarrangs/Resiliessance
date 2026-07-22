import { createClient } from '@supabase/supabase-js';

const VALID_URL = 'https://mfkzyryotmsmevnweuws.supabase.co';
const VALID_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ma3p5cnlvdG1zbWV2bndldXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjM4MTksImV4cCI6MjA5Nzk5OTgxOX0.er7t42Dh7UkAN-Udda1dOMiXvpbylv8-RWyqXBDy6cA';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || VALID_URL;
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || VALID_KEY;

if (!key || key.startsWith('sb_publishable') || !key.startsWith('eyJ')) {
  key = VALID_KEY;
}
if (!url || url.includes('placeholder')) {
  url = VALID_URL;
}

export const supabase = createClient(url, key);
