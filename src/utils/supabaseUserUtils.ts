import { supabase } from '@/integrations/supabase/client';

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

export async function ensureProfileExists(userId: string, userData: any) {
  if (!userId) {
    console.error("Cannot ensure profile: missing user ID");
    return null;
  }
  
  try {
    // First check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error checking profile:", fetchError);
      return null;
    }
    
    // Return existing profile if found
    if (existingProfile) {
      return existingProfile;
    }
    
    // Otherwise create new profile
    console.log("Creating new profile for user:", userId);
    
    // Extract profile data
    const fullName = userData.user_metadata?.full_name || 
                     userData.user_metadata?.name || 
                     `User-${userId.substring(0, 6)}`;
                     
    const avatarUrl = userData.user_metadata?.avatar_url || 
                      userData.user_metadata?.picture;
                      
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
        provider: provider
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error("Error creating profile:", insertError);
      return null;
    }
    
    return newProfile;
  } catch (error) {
    console.error("Error in ensureProfileExists:", error);
    return null;
  }
}
