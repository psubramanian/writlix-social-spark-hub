import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xhccvoivnelbzvzxmcoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoY2N2b2l2bmVsYnp2enhtY295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjEyNzksImV4cCI6MjA2MTA5NzI3OX0.kPScndVirju5kGDPV8AsCuWVoqC3Qek2e9bItBX86mg";

// Enhanced Supabase client with improved session handling, persistence, and recovery
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Change from 'implicit' to 'pkce' for better reliability
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
    // Set a longer storage key to avoid conflicts with other apps
    storageKey: 'writlix_supabase_auth',
    // Removed cookieOptions as it's not supported
  },
  global: {
    headers: {
      'x-app-version': '1.1.0',
      'x-client-info': 'writlix-webapp',
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

// Initialize session recovery mechanism
let sessionRecoveryAttempts = 0;
const maxSessionRecoveryAttempts = 3;

// Enhanced session state handling with timestamps for debugging
// The sessionStatus object tracks the current state of auth to help debug issues
const sessionStatus = {
  lastCheck: new Date().toISOString(),
  hasActiveSession: false,
  recoveryAttempted: false,
  sessionError: null as Error | null,
};

// Enhanced logging of auth events with timestamps
supabase.auth.onAuthStateChange((event, session) => {
  const timestamp = new Date().toISOString();
  // Synchronous quick updates for immediate UI feedback
  console.log(`[AUTH ${timestamp}] Auth state changed: ${event}`, session?.user?.email || 'No user');
  
  // Detailed event logging
  switch(event) {
    case 'SIGNED_IN':
      console.log(`[AUTH ${timestamp}] User signed in: ${session?.user?.email}`);
      // Store multiple auth flags in localStorage to provide a backup
      localStorage.setItem('auth_active', 'true');
      localStorage.setItem('auth_timestamp', timestamp);
      localStorage.setItem('auth_email', session?.user?.email || '');
      // Reset recovery attempts on successful sign in
      sessionRecoveryAttempts = 0;
      sessionStatus.hasActiveSession = true;
      sessionStatus.recoveryAttempted = false;
      sessionStatus.sessionError = null;
      break;
    
    case 'SIGNED_OUT':
      console.log(`[AUTH ${timestamp}] User signed out`);
      localStorage.removeItem('auth_active');
      localStorage.removeItem('auth_timestamp');
      localStorage.removeItem('auth_email');
      sessionStatus.hasActiveSession = false;
      break;
      
    case 'USER_UPDATED':
      console.log(`[AUTH ${timestamp}] User updated: ${session?.user?.email}`);
      break;
      
    case 'TOKEN_REFRESHED':
      console.log(`[AUTH ${timestamp}] Token refreshed for: ${session?.user?.email}`);
      // Update timestamp to indicate active session with valid token
      localStorage.setItem('auth_timestamp', timestamp);
      break;
      
    case 'PASSWORD_RECOVERY':
      console.log(`[AUTH ${timestamp}] Password recovery initiated`);
      break;
  }
});

// Enhanced session recovery with retry mechanism
export const checkAndRecoverSession = async (forceCheck = false): Promise<boolean> => {
  const timestamp = new Date().toISOString();
  sessionStatus.lastCheck = timestamp;
  
  try {
    // Skip if too many attempts already made
    if (!forceCheck && sessionRecoveryAttempts >= maxSessionRecoveryAttempts) {
      console.warn(`[AUTH ${timestamp}] Maximum session recovery attempts (${maxSessionRecoveryAttempts}) reached, giving up`);
      return false;
    }
    
    // Check if we have a session in Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Check if we have the auth_active flag but no actual session
    const hasAuthFlag = localStorage.getItem('auth_active') === 'true';
    const lastAuthTimestamp = localStorage.getItem('auth_timestamp');
    const storedEmail = localStorage.getItem('auth_email');
    
    // Update status object
    sessionStatus.hasActiveSession = !!session;
    
    if (error) {
      console.error(`[AUTH ${timestamp}] Error checking session:`, error);
      sessionStatus.sessionError = error;
      return false;
    }
    
    // Enhanced session recovery logic
    if (!session && hasAuthFlag) {
      sessionRecoveryAttempts++;
      console.warn(`[AUTH ${timestamp}] Detected broken auth state - has flag but no session (attempt ${sessionRecoveryAttempts}/${maxSessionRecoveryAttempts})`);
      console.log(`[AUTH ${timestamp}] Last activity: ${lastAuthTimestamp || 'unknown'}, email: ${storedEmail || 'unknown'}`);
      
      sessionStatus.recoveryAttempted = true;
      
      // Attempt to refresh the session
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && data.session) {
          console.log(`[AUTH ${timestamp}] Successfully recovered session`);
          // Update local state to reflect recovered session
          localStorage.setItem('auth_timestamp', timestamp);
          return true;
        } else if (refreshError) {
          console.error(`[AUTH ${timestamp}] Failed to refresh session:`, refreshError);
        }
      } catch (refreshError) {
        console.error(`[AUTH ${timestamp}] Error during session refresh:`, refreshError);
      }
      
      // If we've reached max attempts, alert the user about the broken state
      if (sessionRecoveryAttempts >= maxSessionRecoveryAttempts) {
        console.warn(`[AUTH ${timestamp}] Maximum recovery attempts reached, consider clearing local storage`);
        // Clean up local storage to prevent future attempts
        localStorage.removeItem('auth_active');
        localStorage.removeItem('auth_timestamp');
        localStorage.removeItem('auth_email');
      }
    }
    
    return !!session;
  } catch (err) {
    console.error(`[AUTH ${timestamp}] Unexpected error in checkAndRecoverSession:`, err);
    sessionStatus.sessionError = err as Error;
    return false;
  }
};

// Export session status object for debugging
export const getSessionStatus = () => ({
  ...sessionStatus,
  recoveryAttempts: sessionRecoveryAttempts,
  maxRecoveryAttempts: maxSessionRecoveryAttempts
});

// Added utility to clean up all auth-related storage
export const cleanupAuthStorage = () => {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] Cleaning up all auth-related storage`);
  
  try {
    // Clean localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || 
          key.includes('sb-') || 
          key.startsWith('auth_') || 
          key.startsWith('profile_') ||
          key === 'writlix_supabase_auth') {
        localStorage.removeItem(key);
      }
    });
    
    // Clean sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || 
          key.includes('sb-') || 
          key.startsWith('auth_') || 
          key.startsWith('profile_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log(`[AUTH ${timestamp}] Auth storage cleaned up successfully`);
    return true;
  } catch (error) {
    console.error(`[AUTH ${timestamp}] Error cleaning auth storage:`, error);
    return false;
  }
};
