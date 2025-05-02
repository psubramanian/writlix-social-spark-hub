import { supabase } from '@/integrations/supabase/client';

/**
 * Creates or retrieves user profile, with enhanced error handling and consistency
 */
export async function ensureProfileExists(userId: string, userData: any) {
  const timestamp = new Date().toISOString();
  
  if (!userId) {
    console.error(`[PROFILE ${timestamp}] Cannot ensure profile: missing user ID`);
    return null;
  }
  
  if (!userData) {
    console.error(`[PROFILE ${timestamp}] Cannot ensure profile: missing user data`);
    return null;
  }
  
  try {
    console.log(`[PROFILE ${timestamp}] Checking for existing profile for user:`, userId);
    
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
          console.warn(`[PROFILE ${timestamp}] Error checking for profile (attempt ${attempts}):`, error);
          
          if (attempts >= maxAttempts) {
            throw error;
          }
        } else if (data) {
          existingProfile = data;
          console.log(`[PROFILE ${timestamp}] Existing profile found after ${attempts} attempt(s)`);
          
          // Mark profile as complete in database if it exists but isn't marked
          if (!data.profile_completed) {
            try {
              const updateResult = await supabase
                .from('profiles')
                .update({ 
                  profile_completed: true, 
                  updated_at: new Date().toISOString() 
                })
                .eq('id', userId);
              
              if (updateResult.error) {
                throw updateResult.error;
              }
              
              console.log(`[PROFILE ${timestamp}] Marked existing profile as complete`);
              
              // Update our local profile object
              existingProfile.profile_completed = true;
              
              // Also set local storage flag for backup
              markProfileComplete();
            } catch (updateError) {
              console.warn(`[PROFILE ${timestamp}] Failed to mark profile as complete:`, updateError);
              // Continue anyway, we'll just use local flags as backup
            }
          }
          
          break;
        }
      } catch (fetchError) {
        console.error(`[PROFILE ${timestamp}] Fetch attempt ${attempts} failed:`, fetchError);
        
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
      // Make sure local storage is consistent with database
      if (existingProfile.profile_completed) {
        markProfileComplete();
      }
      return existingProfile;
    }
    
    // Otherwise create new profile
    console.log(`[PROFILE ${timestamp}] Creating new profile for user:`, userId);
    
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
            profile_completed: true, // Always set to true by default now
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (error) {
          console.warn(`[PROFILE ${timestamp}] Error creating profile (attempt ${attempts}):`, error);
          
          if (attempts >= maxAttempts) {
            throw error;
          }
        } else if (data) {
          newProfile = data;
          console.log(`[PROFILE ${timestamp}] New profile created successfully after ${attempts} attempt(s)`);
          
          // Set local storage flag for backup
          markProfileComplete();
          break;
        }
      } catch (insertError) {
        console.error(`[PROFILE ${timestamp}] Insert attempt ${attempts} failed:`, insertError);
        
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
    console.error(`[PROFILE ${timestamp}] All profile creation attempts failed`);
    
    // Return a minimal profile even if DB insertion failed
    // This prevents authentication loops where users get stuck
    return createFallbackProfile(userId, userData);
    
  } catch (error) {
    console.error(`[PROFILE ${timestamp}] Unexpected error in ensureProfileExists:`, error);
    
    // Return minimal fallback profile on any error
    return createFallbackProfile(userId, userData);
  }
}

/**
 * Creates a fallback profile object when database operations fail
 * This helps prevent authentication loops
 */
function createFallbackProfile(userId: string, userData: any) {
  // Always mark profile as complete to prevent loops
  markProfileComplete();
  
  return {
    id: userId,
    full_name: userData.email?.split('@')[0] || `User-${userId.substring(0, 6)}`,
    email: userData.email,
    profile_completed: true,
    _fallback: true, // Indicate this is a fallback profile
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Mark profile as complete in localStorage
 */
export function markProfileComplete() {
  localStorage.setItem('profile_completed', 'true');
  localStorage.removeItem('profile_skip_attempted');
  localStorage.removeItem('profile_bypass_attempts');
}

/**
 * Mark profile as not completed in localStorage
 */
export function markProfileIncomplete() {
  localStorage.removeItem('profile_completed');
  localStorage.removeItem('profile_skip_attempted');
}

/**
 * Check if user profile is complete based on multiple data sources
 * with centralized logic and enhanced logging
 */
export function isProfileComplete(userProfile: any) {
  // Always consider fallback profiles as complete
  if (userProfile?._fallback === true) {
    return true;
  }
  
  // Check database field first if available
  if (userProfile?.profile_completed === true) {
    return true;
  }
  
  // Fall back to localStorage flags if no database field
  const hasSkippedProfileCompletion = localStorage.getItem('profile_skip_attempted') === 'true';
  const hasCompletedProfile = localStorage.getItem('profile_completed') === 'true';
  
  // Consider a profile complete if any of these conditions are met
  const isComplete = hasSkippedProfileCompletion || hasCompletedProfile;
  
  // Sync local storage with determination if needed
  if (isComplete && !hasCompletedProfile) {
    markProfileComplete();
  }
  
  return isComplete;
}
