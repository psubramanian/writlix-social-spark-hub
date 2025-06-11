
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export function usePostContent() {
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
        .eq('id', postId as any)
        .eq('user_id', user.id as any)
        .maybeSingle();
      
      if (postError) {
        throw new Error('Failed to fetch post data');
      }
      
      if (!postData) {
        throw new Error('Post not found');
      }
      
      // Type guard to ensure postData has the expected properties
      if (!('user_id' in postData) || !('content_id' in postData)) {
        throw new Error('Invalid post data structure');
      }
      
      // Verify user owns this post
      if (postData.user_id !== user.id) {
        throw new Error('Not authorized to update this post');
      }
      
      // Now update the content without changing the status
      if (!postData.content_id) {
        throw new Error('Content ID not found');
      }

      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ content: String(content) } as any)
        .eq('id', postData.content_id as any);
      
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
        .eq('id', postId as any)
        .eq('user_id', user.id as any)
        .maybeSingle();
      
      if (postError) {
        throw new Error('Failed to fetch post data');
      }
      
      if (!post) {
        throw new Error('Post not found');
      }
      
      // Type guard to ensure post has the expected properties
      if (!('user_id' in post) || !('content_id' in post) || !('content_ideas' in post)) {
        throw new Error('Invalid post data structure');
      }
      
      // Verify user owns this post
      if (post.user_id !== user.id) {
        throw new Error('Not authorized to update this post');
      }
      
      // Extract title safely from the nested data structure
      const contentIdeas = post.content_ideas as any;
      const title = contentIdeas?.title;
      
      if (!title) {
        throw new Error('Post title not found');
      }
      
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
      if (!post.content_id) {
        throw new Error('Content ID not found');
      }

      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ content: String(generatedContent[0].content) } as any)
        .eq('id', post.content_id as any);
      
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

  return {
    savePostContent,
    regenerateContent,
    isRegenerating
  };
}
