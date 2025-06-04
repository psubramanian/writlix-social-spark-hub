
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export function usePostOperations() {
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const savePostContent = async (postId: string, content: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      // First get the scheduled post to find the content_id
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .select('content_id, user_id')
        .eq('id', Number(postId))
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (postError || !postData) {
        throw new Error('Failed to fetch post data');
      }
      
      // Verify user owns this post
      if (postData.user_id !== user.id) {
        throw new Error('Not authorized to update this post');
      }
      
      // Now update the content without changing the status
      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ content })
        .eq('id', postData.content_id);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Content Updated",
        description: "Your post content has been saved successfully."
      });
      
      return true;
    } catch (error: any) {
      console.error('Error saving post content:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const regenerateContent = async (postId: string) => {
    try {
      setIsRegenerating(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get the post content and title
      const { data: post, error: postError } = await supabase
        .from('scheduled_posts')
        .select(`
          content_id,
          user_id,
          content_ideas (
            title
          )
        `)
        .eq('id', Number(postId))
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (postError || !post || !post.content_ideas) {
        throw new Error('Failed to fetch post data');
      }
      
      // Verify user owns this post
      if (post.user_id !== user.id) {
        throw new Error('Not authorized to update this post');
      }
      
      const title = post.content_ideas.title;
      
      // Call the generate-content function with the title as prompt
      const { data: generatedContent, error: generationError } = await supabase.functions.invoke(
        'generate-content',
        {
          body: {
            prompt: title,
            count: 1
          }
        }
      );
      
      if (generationError || !generatedContent || !generatedContent[0]) {
        throw new Error('Failed to generate new content');
      }
      
      // Update the content without changing status
      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ content: generatedContent[0].content })
        .eq('id', post.content_id);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Content Regenerated",
        description: "Your post content has been refreshed."
      });
      
      // Return the new content
      return generatedContent[0].content;
    } catch (error: any) {
      console.error('Error regenerating content:', error);
      toast({
        title: "Regeneration Failed",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const postToLinkedIn = async (postId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

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
    savePostContent,
    regenerateContent,
    isRegenerating,
    postToLinkedIn,
    postToFacebook,
    postToInstagram
  };
}
