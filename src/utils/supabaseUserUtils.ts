import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Authentication error:", authError);
      return null;
    }
    
    if (!user) {
      console.log("No user found");
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function ensureProfileExists(userId: string, userData: any) {
  try {
    if (!userId) {
      console.error("Cannot ensure profile: missing user ID");
      return null;
    }
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error checking profile:", fetchError);
      throw fetchError;
    }
    
    // If profile already exists, return it
    if (existingProfile) {
      return existingProfile;
    }
    
    // Otherwise, create a new profile
    console.log("Creating new profile for user:", userId);
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: userData.user_metadata?.full_name || userData.user_metadata?.name,
        avatar_url: userData.user_metadata?.avatar_url || userData.user_metadata?.picture,
        email: userData.email,
        provider: userData.app_metadata?.provider
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error("Error creating profile:", insertError);
      throw insertError;
    }
    
    console.log("New profile created:", newProfile);
    return newProfile;
  } catch (error) {
    console.error("Error in ensureProfileExists:", error);
    return null;
  }
}

export function useAuthRedirect() {
  const navigate = useNavigate();
  
  const redirectToLogin = () => {
    navigate('/login');
  };
  
  const redirectToDashboard = () => {
    navigate('/dashboard');
  };
  
  return { redirectToLogin, redirectToDashboard };
}
