
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Gets the currently authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("[AUTH] Authentication error:", error);
      return null;
    }
    
    return data?.user || null;
  } catch (error) {
    console.error("[AUTH] Error getting current user:", error);
    return null;
  }
}

/**
 * Creates or retrieves user profile, with improved error handling and defaults
 */
export async function ensureProfileExists(userId: string, userData: any) {
  if (!userId) {
    console.error("[PROFILE] Cannot ensure profile: missing user ID");
    return null;
  }
  
  try {
    console.log("[PROFILE] Checking for existing profile for user:", userId);
    
    // Add retry logic for better reliability when fetching profiles
    let attempts = 0;
    let existingProfile = null;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && !existingProfile) {
      attempts++;
      
      try {
        // First check if profile already exists
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.warn(`[PROFILE] Error checking for profile (attempt ${attempts}):`, error);
          
          if (attempts >= maxAttempts) {
            throw error;
          }
        } else if (data) {
          existingProfile = data;
          console.log(`[PROFILE] Existing profile found after ${attempts} attempt(s)`);
          
          // Mark profile as complete in database if it exists but isn't marked
          if (!data.profile_completed) {
            try {
              await supabase
                .from('profiles')
                .update({ profile_completed: true, updated_at: new Date().toISOString() })
                .eq('id', userId);
              
              console.log("[PROFILE] Marked existing profile as complete");
              
              // Update our local profile object
              existingProfile.profile_completed = true;
              
              // Also set local storage flag for backup
              localStorage.setItem('profile_completed', 'true');
            } catch (updateError) {
              console.warn("[PROFILE] Failed to mark profile as complete:", updateError);
              // Continue anyway, we'll just use local flags as backup
            }
          }
          
          break;
        }
      } catch (fetchError) {
        console.error(`[PROFILE] Fetch attempt ${attempts} failed:`, fetchError);
        
        if (attempts >= maxAttempts) {
          throw fetchError;
        }
      }
      
      // Wait a bit before trying again
      if (!existingProfile && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Return existing profile if found
    if (existingProfile) {
      return existingProfile;
    }
    
    // Otherwise create new profile
    console.log("[PROFILE] Creating new profile for user:", userId);
    
    // Extract profile data with better fallbacks
    const fullName = userData.user_metadata?.full_name || 
                     userData.user_metadata?.name || 
                     userData.email?.split('@')[0] ||
                     `User-${userId.substring(0, 6)}`;
                     
    const avatarUrl = userData.user_metadata?.avatar_url || 
                      userData.user_metadata?.picture ||
                      null;
                      
    const email = userData.email;
    const provider = userData.app_metadata?.provider || 'email';
    
    // Add retry logic for inserts too
    attempts = 0;
    let newProfile = null;
    
    while (attempts < maxAttempts && !newProfile) {
      attempts++;
      
      try {
        // Insert new profile - now with profile_completed flag set to true by default
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: fullName,
            avatar_url: avatarUrl,
            email: email,
            provider: provider,
            profile_completed: true, // Set to true by default
            created_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (error) {
          console.warn(`[PROFILE] Error creating profile (attempt ${attempts}):`, error);
          
          if (attempts >= maxAttempts) {
            throw error;
          }
        } else if (data) {
          newProfile = data;
          console.log(`[PROFILE] New profile created successfully after ${attempts} attempt(s)`);
          
          // Set local storage flag for backup
          localStorage.setItem('profile_completed', 'true');
          break;
        }
      } catch (insertError) {
        console.error(`[PROFILE] Insert attempt ${attempts} failed:`, insertError);
        
        if (attempts >= maxAttempts) {
          throw insertError;
        }
      }
      
      // Wait a bit before trying again
      if (!newProfile && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (newProfile) {
      return newProfile;
    }
    
    // If we got here, all insert attempts failed
    console.error("[PROFILE] All profile creation attempts failed");
    
    // Return a minimal profile even if DB insertion failed
    // This prevents authentication loops where users get stuck
    return {
      id: userId,
      full_name: fullName,
      avatar_url: avatarUrl,
      email: email,
      provider: provider,
      profile_completed: true, // Mark as complete to prevent loops
      _fallback: true // Indicate this is a fallback profile
    };
    
  } catch (error) {
    console.error("[PROFILE] Unexpected error in ensureProfileExists:", error);
    
    // Return minimal fallback profile on any error
    return {
      id: userId,
      full_name: userData.email?.split('@')[0] || `User-${userId.substring(0, 6)}`,
      email: userData.email,
      profile_completed: true, // Mark as complete to prevent loops
      _fallback: true
    };
  }
}

/**
 * Auth redirect hook
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  
  const redirectToLogin = useCallback(() => {
    console.log("[AUTH] Redirecting to login page");
    navigate('/login');
  }, [navigate]);
  
  const redirectToDashboard = useCallback(() => {
    console.log("[AUTH] Redirecting to dashboard");
    navigate('/dashboard');
  }, [navigate]);
  
  return { redirectToLogin, redirectToDashboard };
}

/**
 * Check if user profile is complete based on multiple data sources
 */
export function isProfileComplete(userProfile: any) {
  // Check database field first if available
  if (userProfile?.profile_completed === true) {
    return true;
  }
  
  // Fall back to localStorage flags if no database field
  const hasSkippedProfileCompletion = localStorage.getItem('profile_skip_attempted') === 'true';
  const hasCompletedProfile = localStorage.getItem('profile_completed') === 'true';
  
  // Consider a profile complete if any of these conditions are met
  return hasSkippedProfileCompletion || hasCompletedProfile;
}
