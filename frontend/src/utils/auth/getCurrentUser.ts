
import { supabase } from '@/integrations/supabase/client';

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
