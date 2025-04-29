
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xhccvoivnelbzvzxmcoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoY2N2b2l2bmVsYnp2enhtY295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjEyNzksImV4cCI6MjA2MTA5NzI3OX0.kPScndVirju5kGDPV8AsCuWVoqC3Qek2e9bItBX86mg";

// Configure Supabase client with explicit settings for better session handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Important for OAuth flows
    flowType: 'implicit', // Use implicit flow type for simpler auth flows
  },
  global: {
    // Add retries for better reliability
    fetch: (url, options) => {
      const retries = 3;
      const retryDelay = 500; // ms
      
      const customFetch = async (attempt = 0): Promise<Response> => {
        try {
          return await fetch(url, options);
        } catch (error) {
          if (attempt < retries) {
            console.log(`[SUPABASE] Fetch attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return customFetch(attempt + 1);
          }
          throw error;
        }
      };
      
      return customFetch();
    }
  }
});

// Setup default logging of important auth events
supabase.auth.onAuthStateChange((event, session) => {
  // Synchronous quick updates
  console.log(`[AUTH] Auth state changed: ${event}`, session?.user?.email || 'No user');
  
  // Log important events to help with debugging
  switch(event) {
    case 'SIGNED_IN':
      console.log(`[AUTH] User signed in: ${session?.user?.email}`);
      break;
    case 'SIGNED_OUT':
      console.log(`[AUTH] User signed out`);
      break;
    case 'USER_UPDATED':
      console.log(`[AUTH] User updated: ${session?.user?.email}`);
      break;
    case 'TOKEN_REFRESHED':
      console.log(`[AUTH] Token refreshed for: ${session?.user?.email}`);
      break;
  }
});
