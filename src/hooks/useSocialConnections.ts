
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { credentialsOperations, isValidData } from '@/utils/supabaseHelpers';

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
  const { user } = useAuth();

  const checkAllConnections = async () => {
    if (!user?.id) {
      console.log('No user found for social connection check');
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log('Checking all social connections for user:', user.id);
    
    try {
      // Check all platforms in parallel
      const [linkedInData, facebookData, instagramData] = await Promise.all([
        credentialsOperations.linkedin.fetch(user.id),
        credentialsOperations.facebook.fetch(user.id),
        credentialsOperations.instagram.fetch(user.id)
      ]);

      const newConnections = {
        linkedin: isValidData(linkedInData) && !!(linkedInData as any)?.access_token,
        facebook: isValidData(facebookData) && 
          (!!(facebookData as any)?.access_token || !!(facebookData as any)?.long_lived_token),
        instagram: isValidData(instagramData) && 
          (!!(instagramData as any)?.access_token || !!(instagramData as any)?.long_lived_token)
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
