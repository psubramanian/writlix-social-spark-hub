
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
        throw new Error(data?.message || 'Failed to post to LinkedIn');
      }

      console.log('LinkedIn post response:', data);

      toast({
        title: "Success",
        description: "Post has been shared to LinkedIn",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      toast({
        title: "Failed to post",
        description: error.message || "An error occurred while posting to LinkedIn",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    postToLinkedIn
  };
}
