
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { credentialsOperations } from '@/utils/supabaseHelpers';

interface SocialProfile {
  name: string;
  profilePicture?: string;
  username?: string;
  headline?: string;
}

interface SocialProfiles {
  linkedin?: SocialProfile;
  facebook?: SocialProfile;
  instagram?: SocialProfile;
}

export function useSocialPreview() {
  const [profiles, setProfiles] = useState<SocialProfiles>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchSocialProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch LinkedIn profile
      const linkedinData = await credentialsOperations.linkedin.fetch(user.id);

      // Fetch Facebook profile
      const facebookData = await credentialsOperations.facebook.fetch(user.id);

      // Fetch Instagram profile
      const instagramData = await credentialsOperations.instagram.fetch(user.id);

      const newProfiles: SocialProfiles = {};

      // Process LinkedIn profile with proper type checking
      if (linkedinData && typeof linkedinData === 'object' && 'linkedin_profile_data' in linkedinData) {
        const profileData = (linkedinData as any).linkedin_profile_data;
        if (profileData) {
          newProfiles.linkedin = {
            name: profileData.name || profileData.localizedFirstName + ' ' + profileData.localizedLastName || 'LinkedIn User',
            profilePicture: profileData.profilePicture?.displayImage || undefined,
            headline: profileData.headline || 'Professional'
          };
        }
      }

      // Process Facebook profile with proper type checking
      if (facebookData && typeof facebookData === 'object' && 'facebook_profile_data' in facebookData) {
        const profileData = (facebookData as any).facebook_profile_data;
        if (profileData) {
          newProfiles.facebook = {
            name: profileData.name || 'Facebook User',
            profilePicture: profileData.picture?.data?.url || undefined
          };
        }
      }

      // Process Instagram profile with proper type checking
      if (instagramData && typeof instagramData === 'object' && 'instagram_profile_data' in instagramData) {
        const profileData = (instagramData as any).instagram_profile_data;
        if (profileData) {
          newProfiles.instagram = {
            name: profileData.name || profileData.username || 'Instagram User',
            username: profileData.username || 'instagramuser',
            profilePicture: profileData.profile_picture_url || undefined
          };
        }
      }

      setProfiles(newProfiles);
    } catch (error) {
      console.error('Error fetching social profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialProfiles();
  }, [user]);

  return {
    profiles,
    loading,
    refetch: fetchSocialProfiles
  };
}
