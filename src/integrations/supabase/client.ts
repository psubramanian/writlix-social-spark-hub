
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xhccvoivnelbzvzxmcoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoY2N2b2l2bmVsYnp2enhtY295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjEyNzksImV4cCI6MjA2MTA5NzI3OX0.kPScndVirju5kGDPV8AsCuWVoqC3Qek2e9bItBX86mg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
