
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
import type { ScheduledPost } from './useScheduledPosts';

export function useScheduledPostsFetch() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();

  const fetchPosts = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return;
      }

      console.log('Fetching all scheduled posts');

      // Only get pending posts, not published ones
      const { data: postsData, error: postsError } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          content_ideas (
            id,
            title,
            content,
            status
          )
        `)
        .eq('user_id', user.id as any)
        .eq('status', 'pending' as any)
        .order('next_run_at', { ascending: true });

      if (postsError) throw postsError;

      console.log('Fetched scheduled posts:', postsData);
      
      // Filter to only include posts where content_ideas status is 'Scheduled'
      // This is the key change to fix the issue
      const filteredPosts = postsData ? postsData.filter(post => {
        // Type guard to ensure post has content_ideas
        if (!post || typeof post !== 'object' || !('content_ideas' in post) || !post.content_ideas) {
          return false;
        }
        const contentIdeas = post.content_ideas;
        return contentIdeas && typeof contentIdeas === 'object' && 'status' in contentIdeas && contentIdeas.status === 'Scheduled';
      }) : [];
      
      console.log('After filtering for Scheduled status:', filteredPosts);
      
      // Improved deduplication: Consider both date and content ID
      const uniquePosts = [];
      const seenContentIds = new Set();
      
      for (const post of filteredPosts) {
        if (!post || typeof post !== 'object' || !('content_ideas' in post) || !post.content_ideas) {
          continue;
        }
        const contentIdeas = post.content_ideas;
        const contentId = contentIdeas && typeof contentIdeas === 'object' && 'id' in contentIdeas ? contentIdeas.id : null;
        
        // Skip this post if we've already seen this content ID
        if (contentId && seenContentIds.has(contentId)) {
          console.log(`Skipping duplicate post for content ID: ${contentId}`);
          continue;
        }
        
        // Add this content ID to our tracking set if it exists
        if (contentId) {
          seenContentIds.add(contentId);
        }
        
        uniquePosts.push(post);
      }

      const postsArray = uniquePosts as ScheduledPost[];
      setPosts(postsArray);
      
      return postsArray;
      
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Failed to load posts",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    fetchPosts,
    setPosts
  };
}
