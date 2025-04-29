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
      console.error("Authentication error:", error);
      return null;
    }
    
    return data?.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Creates or retrieves user profile, with improved error handling and defaults
 */
export async function ensureProfileExists(userId: string, userData: any) {
  if (!userId) {
    console.error("Cannot ensure profile: missing user ID");
    return null;
  }
  
  try {
    console.log("[PROFILE] Checking for existing profile for user:", userId);
    
    // First check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("[PROFILE] Error checking for profile:", fetchError);
    }
    
    // Return existing profile if found
    if (existingProfile) {
      console.log("[PROFILE] Existing profile found");
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
    
    // Insert new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        email: email,
        provider: provider,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error("[PROFILE] Error creating profile:", insertError);
      
      // Return a minimal profile even if DB insertion failed
      // This prevents authentication loops where users get stuck
      return {
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        email: email,
        provider: provider,
        _fallback: true // Indicate this is a fallback profile
      };
    }
    
    console.log("[PROFILE] New profile created successfully");
    return newProfile;
  } catch (error) {
    console.error("[PROFILE] Unexpected error in ensureProfileExists:", error);
    
    // Return minimal fallback profile on any error
    return {
      id: userId,
      full_name: userData.email?.split('@')[0] || `User-${userId.substring(0, 6)}`,
      email: userData.email,
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
