
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      const { data: linkedinData } = await supabase
        .from('user_linkedin_credentials')
        .select('linkedin_profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch Facebook profile
      const { data: facebookData } = await supabase
        .from('user_facebook_credentials')
        .select('facebook_profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch Instagram profile
      const { data: instagramData } = await supabase
        .from('user_instagram_credentials')
        .select('instagram_profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      const newProfiles: SocialProfiles = {};

      // Process LinkedIn profile
      if (linkedinData?.linkedin_profile_data) {
        const profileData = linkedinData.linkedin_profile_data as any;
        newProfiles.linkedin = {
          name: profileData.name || profileData.localizedFirstName + ' ' + profileData.localizedLastName || 'LinkedIn User',
          profilePicture: profileData.profilePicture?.displayImage || undefined,
          headline: profileData.headline || 'Professional'
        };
      }

      // Process Facebook profile
      if (facebookData?.facebook_profile_data) {
        const profileData = facebookData.facebook_profile_data as any;
        newProfiles.facebook = {
          name: profileData.name || 'Facebook User',
          profilePicture: profileData.picture?.data?.url || undefined
        };
      }

      // Process Instagram profile
      if (instagramData?.instagram_profile_data) {
        const profileData = instagramData.instagram_profile_data as any;
        newProfiles.instagram = {
          name: profileData.name || profileData.username || 'Instagram User',
          username: profileData.username || 'instagramuser',
          profilePicture: profileData.profile_picture_url || undefined
        };
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
