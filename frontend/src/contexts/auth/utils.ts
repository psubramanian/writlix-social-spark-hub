
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { ExtendedUser } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileExists, isProfileComplete } from "@/utils/auth/profileUtils";

export const logDebug = (debugMode: boolean, message: string, ...args: any[]) => {
  if (debugMode) {
    console.log(`[AUTH DEBUG] ${message}`, ...args);
  }
};

export const fetchUserProfile = async (userId: string, sessionUser: SupabaseUser) => {
  const timestamp = new Date().toISOString();
  try {
    console.log(`[AUTH ${timestamp}] Fetching profile for user:`, userId);
    // Pass the sessionUser parameter to ensureProfileExists
    const profile = await ensureProfileExists(userId, sessionUser);
    
    if (profile) {
      console.log(`[AUTH ${timestamp}] Profile fetched successfully for:`, userId);
    } else {
      console.warn(`[AUTH ${timestamp}] No profile returned for:`, userId);
    }
    
    return profile;
  } catch (error) {
    console.error(`[AUTH ${timestamp}] Error fetching/creating user profile:`, error);
    return null;
  }
};

export const processUserData = async (sessionData: Session | null): Promise<ExtendedUser | null> => {
  const timestamp = new Date().toISOString();
  
  if (!sessionData?.user) {
    console.log(`[AUTH ${timestamp}] No session or user found in processUserData`);
    return null;
  }
  
  try {
    console.log(`[AUTH ${timestamp}] Processing user data for:`, sessionData.user.email);
    const profile = await fetchUserProfile(sessionData.user.id, sessionData.user);
    const userData = sessionData.user as ExtendedUser;
    
    userData.name = profile?.full_name || userData.email?.split('@')[0] || 'User';
    userData.avatar = profile?.avatar_url || null;
    userData.linkedInConnected = profile?.provider === 'linkedin_oidc';
    
    // Use a more deterministic and reliable approach for profile completion status
    // First check database flag, then localStorage flags as fallbacks
    userData.profileComplete = isProfileComplete(profile);
    
    console.log(`[AUTH ${timestamp}] User data processed:`, {
      email: userData.email,
      name: userData.name,
      profileComplete: userData.profileComplete ? 'Yes' : 'No',
    });
    
    return userData;
  } catch (error) {
    console.error(`[AUTH ${timestamp}] Unexpected error in processUserData:`, error);
    
    // Create minimal user data with fallback values
    const userData = sessionData.user as ExtendedUser;
    userData.name = sessionData.user.email?.split('@')[0] || 'User';
    userData.profileComplete = true; // Mark as complete to prevent loops
    
    console.log(`[AUTH ${timestamp}] Created fallback user data for:`, userData.email);
    
    return userData;
  }
};

// Re-export storage utils for backwards compatibility
export { 
  clearAuthLocalStorage, 
  restoreAuthLocalFlags,
  saveAuthLocalFlagsToSession,
  getAllAuthStorage
} from '@/utils/auth/storageUtils';

// Re-export profile utils for backwards compatibility
export {
  markProfileComplete,
  markProfileIncomplete,
  isProfileComplete
} from '@/utils/auth/profileUtils';
