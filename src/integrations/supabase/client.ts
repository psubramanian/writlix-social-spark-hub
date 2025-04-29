
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xhccvoivnelbzvzxmcoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoY2N2b2l2bmVsYnp2enhtY295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjEyNzksImV4cCI6MjA2MTA5NzI3OX0.kPScndVirju5kGDPV8AsCuWVoqC3Qek2e9bItBX86mg";

// Configure Supabase client with improved session handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
  global: {
    headers: {
      'x-app-version': '1.1.0', // Add version to help with debugging
    },
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

// Enhanced logging of auth events
supabase.auth.onAuthStateChange((event, session) => {
  // Synchronous quick updates for immediate UI feedback
  console.log(`[AUTH] Auth state changed: ${event}`, session?.user?.email || 'No user');
  
  // Detailed event logging
  switch(event) {
    case 'SIGNED_IN':
      console.log(`[AUTH] User signed in: ${session?.user?.email}`);
      // Store a separate auth flag in localStorage to provide a backup
      localStorage.setItem('auth_active', 'true');
      localStorage.setItem('auth_timestamp', new Date().toISOString());
      break;
    case 'SIGNED_OUT':
      console.log(`[AUTH] User signed out`);
      localStorage.removeItem('auth_active');
      localStorage.removeItem('auth_timestamp');
      break;
    case 'USER_UPDATED':
      console.log(`[AUTH] User updated: ${session?.user?.email}`);
      break;
    case 'TOKEN_REFRESHED':
      console.log(`[AUTH] Token refreshed for: ${session?.user?.email}`);
      break;
  }
});

// Add a helper function to detect and recover from broken auth states
export const checkAndRecoverSession = async () => {
  try {
    // Check if we have a session in Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Check if we have the auth_active flag but no actual session
    const hasAuthFlag = localStorage.getItem('auth_active') === 'true';
    
    if (error) {
      console.error("[AUTH] Error checking session:", error);
      return null;
    }
    
    // Session recovery logic
    if (!session && hasAuthFlag) {
      console.warn("[AUTH] Detected broken auth state - has flag but no session");
      
      // Force re-login in case of broken state
      if (window.confirm("Your session appears to be broken. Refresh to attempt recovery?")) {
        window.location.reload();
      }
    }
    
    return session;
  } catch (err) {
    console.error("[AUTH] Unexpected error in checkAndRecoverSession:", err);
    return null;
  }
};
