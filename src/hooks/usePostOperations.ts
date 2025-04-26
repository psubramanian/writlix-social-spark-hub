
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
      
      // We no longer show the toast here as it's done in the calling component
      
      return data;
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      // We no longer show the toast here as it's done in the calling component
      throw error; // Re-throw the error for the calling component to handle
    }
  };

  return {
    postToLinkedIn
  };
}
