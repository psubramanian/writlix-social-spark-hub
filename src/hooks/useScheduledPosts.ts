
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { useAuthRedirect } from '@/utils/supabaseUserUtils';
import { useScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { usePostScheduling } from './usePostScheduling';

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
        .order('next_run_at', { ascending: true });

      if (postsError) throw postsError;

      setPosts(postsData as ScheduledPost[]);
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
