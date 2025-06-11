
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export function useSocialPosting() {
  const postToLinkedIn = async (postId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user has connected LinkedIn
      const { data: credentials } = await supabase
        .from('user_linkedin_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!credentials?.access_token) {
        throw new Error('LinkedIn account not connected. Please connect your LinkedIn account in Settings.');
      }

      const { data, error } = await supabase.functions.invoke('post-to-linkedin', {
        body: { postId, userId: user.id }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to post to LinkedIn');
      }

      return true;
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      throw error;
    }
  };
  
  const postToFacebook = async (postId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user has connected Facebook
      const { data: credentials } = await supabase
        .from('user_facebook_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!credentials?.access_token) {
        throw new Error('Facebook account not connected. Please connect your Facebook account in Settings.');
      }

      const { data, error } = await supabase.functions.invoke('post-to-facebook', {
        body: { postId, userId: user.id }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to post to Facebook');
      }

      return true;
    } catch (error: any) {
      console.error('Error posting to Facebook:', error);
      throw error;
    }
  };
  
  const postToInstagram = async (postId: string, imageUrl: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user has connected Instagram
      const { data: credentials } = await supabase
        .from('user_instagram_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!credentials?.access_token) {
        throw new Error('Instagram account not connected. Please connect your Instagram account in Settings.');
      }

      const { data, error } = await supabase.functions.invoke('post-to-instagram', {
        body: { postId, userId: user.id, imageUrl }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to post to Instagram');
      }

      return true;
    } catch (error: any) {
      console.error('Error posting to Instagram:', error);
      throw error;
    }
  };

  return {
    postToLinkedIn,
    postToFacebook,
    postToInstagram
  };
}
