
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
import { useScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { usePostScheduling } from './usePostScheduling';
import { formatInTimeZone } from 'date-fns-tz';

interface ScheduledPost {
  id: string;
  content_ideas: {
    id: number;
    title: string;
    content: string;
    status: string;
  };
  next_run_at: string;
  timezone: string;
  user_id: string;
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();
  const { userSettings, fetchUserSettings } = useScheduleSettings();
  const { postToLinkedIn } = usePostOperations();
  const { scheduleContentIdea } = usePostScheduling();

  const fetchPosts = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return;
      }

      const now = new Date();
      console.log('Fetching scheduled posts after:', now.toISOString());

      // Get posts that are scheduled for the future
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
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gt('next_run_at', now.toISOString()) // Only get future posts
        .order('next_run_at', { ascending: true });

      if (postsError) throw postsError;

      console.log('Fetched scheduled posts:', postsData);
      
      // Improved deduplication: Consider both date and content ID
      const uniquePosts = [];
      const seenContentIds = new Set();
      
      if (postsData) {
        for (const post of postsData) {
          const contentId = post.content_ideas?.id;
          
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
      }

      setPosts(uniquePosts as ScheduledPost[]);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Failed to load posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchUserSettings();
      await fetchPosts();
    };
    
    initialize();
  }, []);

  return {
    posts,
    loading,
    postToLinkedIn,
    fetchPosts,
    scheduleContentIdea,
    userSettings
  };
}
