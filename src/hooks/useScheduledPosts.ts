
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
import { useScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { usePostScheduling } from './usePostScheduling';
import { format } from 'date-fns';

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
      
      // Make sure we have unique posts (no duplicates by next_run_at)
      const uniquePosts = [];
      const seenDates = new Set();
      
      if (postsData) {
        for (const post of postsData) {
          // Format the date for comparison (without seconds)
          const dateKey = format(new Date(post.next_run_at), 'yyyy-MM-dd HH:mm');
          
          if (!seenDates.has(dateKey)) {
            seenDates.add(dateKey);
            uniquePosts.push(post);
          } else {
            console.log('Skipping duplicate post scheduled for:', dateKey);
          }
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
