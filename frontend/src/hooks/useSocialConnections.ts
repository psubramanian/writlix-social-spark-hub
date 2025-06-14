
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser
import { supabase } from '@/integrations/supabase/client';

interface SocialConnectionStatus {
  linkedin: boolean;
  facebook: boolean;
  instagram: boolean;
}

export function useSocialConnections() {
  const [connections, setConnections] = useState<SocialConnectionStatus>({
    linkedin: false,
    facebook: false,
    instagram: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  // The hook's logic heavily depends on the user object, especially user.id.
  // It might be beneficial to not run `checkAllConnections` or event listeners until user is loaded.
  // However, the existing code already checks for `!user?.id` before proceeding in `checkAllConnections`.
  // Adding a top-level loading state for the hook itself could be an option if consumers need to know.
  // For now, we ensure `user` is from Clerk. The `useEffect` dependencies on `user?.id` will still work.
  // If the hook is used in a component that shows UI before user is loaded, that component should handle loading state.
  // A simple check to prevent premature execution if user is not loaded yet:
  // if (!isLoaded && !user) { // initial load before user object is available
  //   return { connections, loading: true, error, refresh: () => {} }; 
  // }
  // The above commented-out block is an option, but for now, let's rely on `!user?.id` checks within the hook.


  const checkAllConnections = async () => {
    if (!user?.id) {
      console.log('No user found for social connection check');
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log('Checking all social connections for user:', user.id);
    
    try {
      // Check all platforms in parallel using simplified approach
      const [linkedInData, facebookData, instagramData] = await Promise.all([
        supabase
          .from('user_linkedin_credentials')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_facebook_credentials')
          .select('access_token, long_lived_token')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_instagram_credentials')
          .select('access_token, long_lived_token')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const newConnections = {
        linkedin: !linkedInData.error && linkedInData.data?.access_token != null,
        facebook: !facebookData.error && (facebookData.data?.access_token != null || facebookData.data?.long_lived_token != null),
        instagram: !instagramData.error && (instagramData.data?.access_token != null || instagramData.data?.long_lived_token != null)
      };
      
      console.log('Updated social connections:', newConnections);
      setConnections(newConnections);
    } catch (error) {
      console.error('Error checking social connections:', error);
      setError('Failed to check social media connections');
    } finally {
      setLoading(false);
    }
  };

  // Listen for connection changes from other components
  useEffect(() => {
    const handleConnectionChange = (event: CustomEvent) => {
      console.log('Social connection change detected:', event.detail);
      // Refresh all connections when any platform changes
      checkAllConnections();
    };

    window.addEventListener('socialConnectionChanged' as any, handleConnectionChange);
    
    return () => {
      window.removeEventListener('socialConnectionChanged' as any, handleConnectionChange);
    };
  }, [user?.id]);

  // Initial check when user changes
  useEffect(() => {
    checkAllConnections();
  }, [user?.id]);

  return {
    connections,
    loading,
    error,
    refresh: checkAllConnections
  };
}
