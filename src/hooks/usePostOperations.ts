
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export function usePostOperations() {
  const { toast } = useToast();

  const postToLinkedIn = async (postId: string) => {
    try {
      console.log(`Attempting to post content with ID: ${postId} to LinkedIn`);
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }
      
      // Check if the user has LinkedIn tokens
      const { data: credentials, error: tokensError } = await supabase
        .from('user_linkedin_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking LinkedIn tokens:', tokensError);
        throw new Error("Error checking LinkedIn connection");
      }
      
      if (!credentials?.access_token) {
        throw new Error("LinkedIn account not connected. Please connect your LinkedIn account in Settings.");
      }
      
      const { data, error } = await supabase.functions.invoke('post-to-linkedin', {
        body: { postId, userId: user.id }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error posting to LinkedIn');
      }

      if (!data || !data.success) {
        console.error('Post was not successful:', data);
        throw new Error(data?.error || 'Failed to post to LinkedIn');
      }

      console.log('LinkedIn post response:', data);
      
      return data;
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      throw error; // Re-throw the error for the calling component to handle
    }
  };

  const postToFacebook = async (postId: string) => {
    try {
      console.log(`Attempting to post content with ID: ${postId} to Facebook`);
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }
      
      // Check if the user has Facebook tokens
      const { data: credentials, error: tokensError } = await supabase
        .from('user_facebook_credentials')
        .select('access_token, long_lived_token')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking Facebook tokens:', tokensError);
        throw new Error("Error checking Facebook connection");
      }
      
      if (!credentials?.access_token && !credentials?.long_lived_token) {
        throw new Error("Facebook account not connected. Please connect your Facebook account in Settings.");
      }
      
      const { data, error } = await supabase.functions.invoke('post-to-facebook', {
        body: { postId, userId: user.id }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error posting to Facebook');
      }

      if (!data || !data.success) {
        console.error('Post was not successful:', data);
        throw new Error(data?.error || 'Failed to post to Facebook');
      }

      console.log('Facebook post response:', data);
      
      return data;
    } catch (error: any) {
      console.error('Error posting to Facebook:', error);
      throw error;
    }
  };

  const postToInstagram = async (postId: string, imageUrl: string) => {
    try {
      console.log(`Attempting to post content with ID: ${postId} to Instagram`);
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }
      
      // Check if the user has Instagram tokens
      const { data: credentials, error: tokensError } = await supabase
        .from('user_instagram_credentials')
        .select('access_token, long_lived_token')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking Instagram tokens:', tokensError);
        throw new Error("Error checking Instagram connection");
      }
      
      if (!credentials?.access_token && !credentials?.long_lived_token) {
        throw new Error("Instagram account not connected. Please connect your Instagram account in Settings.");
      }
      
      if (!imageUrl) {
        throw new Error("Instagram posts require an image. Please provide an image URL.");
      }
      
      const { data, error } = await supabase.functions.invoke('post-to-instagram', {
        body: { postId, userId: user.id, imageUrl }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error posting to Instagram');
      }

      if (!data || !data.success) {
        console.error('Post was not successful:', data);
        throw new Error(data?.error || 'Failed to post to Instagram');
      }

      console.log('Instagram post response:', data);
      
      return data;
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
