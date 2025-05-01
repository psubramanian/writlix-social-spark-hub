
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { ExtendedUser } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileExists } from "@/utils/supabaseUserUtils";

export const logDebug = (debugMode: boolean, message: string, ...args: any[]) => {
  if (debugMode) {
    console.log(`[AUTH DEBUG] ${message}`, ...args);
  }
};

export const fetchUserProfile = async (userId: string, sessionUser: SupabaseUser) => {
  try {
    // Pass the sessionUser parameter to ensureProfileExists
    const profile = await ensureProfileExists(userId, sessionUser);
    return profile;
  } catch (error) {
    console.error('[AUTH] Error fetching/creating user profile:', error);
    return null;
  }
};

export const processUserData = async (sessionData: Session | null): Promise<ExtendedUser | null> => {
  if (!sessionData?.user) {
    console.log("[AUTH] No session or user found in processUserData");
    return null;
  }
  
  try {
    const profile = await fetchUserProfile(sessionData.user.id, sessionData.user);
    const userData = sessionData.user as ExtendedUser;
    
    userData.name = profile?.full_name || 'User';
    userData.avatar = profile?.avatar_url || null;
    userData.linkedInConnected = profile?.provider === 'linkedin_oidc';
    
    // Use a more deterministic approach for profile completion status
    // First check database flag, then localStorage flags as fallbacks
    userData.profileComplete = profile?.profile_completed === true || 
                              localStorage.getItem('profile_completed') === 'true' ||
                              localStorage.getItem('profile_skip_attempted') === 'true';
    
    return userData;
  } catch (error) {
    console.error('[AUTH] Unexpected error in processUserData:', error);
    const userData = sessionData.user as ExtendedUser;
    userData.name = sessionData.user.email?.split('@')[0] || 'User';
    userData.profileComplete = true;
    return userData;
  }
};

export const clearAuthLocalStorage = () => {
  localStorage.removeItem('profile_skip_attempted');
  localStorage.removeItem('profile_completed');
  localStorage.removeItem('profile_bypass_attempts');
  localStorage.removeItem('auth_active');
  localStorage.removeItem('auth_timestamp');
  sessionStorage.removeItem('auth_flow_started');
  sessionStorage.removeItem('auth_provider');
  sessionStorage.removeItem('auth_redirect_url');
  sessionStorage.removeItem('auth_local_flags');
};

export const restoreAuthLocalFlags = () => {
  try {
    const savedFlags = sessionStorage.getItem('auth_local_flags');
    if (savedFlags) {
      const flags = JSON.parse(savedFlags);
      
      // Only restore if current flags are missing
      if (flags.profile_completed && !localStorage.getItem('profile_completed')) {
        localStorage.setItem('profile_completed', flags.profile_completed);
        console.log("[AUTH] Restored profile_completed flag from session storage");
      }
      
      if (flags.profile_skip_attempted && !localStorage.getItem('profile_skip_attempted')) {
        localStorage.setItem('profile_skip_attempted', flags.profile_skip_attempted);
        console.log("[AUTH] Restored profile_skip_attempted flag from session storage");
      }
    }
  } catch (e) {
    console.warn("[AUTH] Error restoring auth flags:", e);
  }
};
