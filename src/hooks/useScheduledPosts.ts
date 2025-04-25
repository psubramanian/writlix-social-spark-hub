
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScheduleSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

interface ScheduledPost {
  id: string;
  content_ideas: {
    id: number;
    title: string;
    content: string;
    status: string;
  };
  schedule_settings: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time_of_day: string;
    day_of_week?: number;
    day_of_month?: number;
    next_run_at: string;
  }[];
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        navigate('/login');
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
          ),
          schedule_settings (
            frequency,
            time_of_day,
            day_of_week,
            day_of_month,
            next_run_at
          )
        `)
        .eq('content_ideas.status', 'Scheduled');

      if (postsError) throw postsError;
      setPosts(postsData || []);
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

  const createScheduledPost = async (contentId: number, settings: ScheduleSettings) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        navigate('/login');
        return;
      }

      // First, create the scheduled post
      const { data: post, error: postError } = await supabase
        .from('scheduled_posts')
        .insert({
          content_id: contentId,
          user_id: user.id,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Calculate next run time
      const nextRunAt = calculateNextRunTime(settings);
      const nextRunAtString = nextRunAt.toISOString();

      // Create the schedule settings
      const { error: settingsError } = await supabase
        .from('schedule_settings')
        .insert({
          post_id: post.id,
          frequency: settings.frequency,
          time_of_day: settings.timeOfDay,
          day_of_week: settings.dayOfWeek,
          day_of_month: settings.dayOfMonth,
          next_run_at: nextRunAtString,
        });

      if (settingsError) throw settingsError;

      // Update content status to Scheduled
      const { error: statusError } = await supabase
        .from('content_ideas')
        .update({ status: 'Scheduled' })
        .eq('id', contentId);

      if (statusError) throw statusError;

      await fetchPosts();
      
      toast({
        title: "Post Scheduled",
        description: "Your post has been scheduled successfully.",
      });
    } catch (error: any) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Failed to schedule post",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const postToLinkedIn = async (postId: string) => {
    try {
      const { error } = await supabase.functions.invoke('post-to-linkedin', {
        body: { postId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post has been shared to LinkedIn",
      });

      await fetchPosts();
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      toast({
        title: "Failed to post",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateNextRunTime = (settings: ScheduleSettings): Date => {
    const now = new Date();
    const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
    let nextRun = new Date(now);
    
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    switch (settings.frequency) {
      case 'daily':
        // Already handled above
        break;
      
      case 'weekly':
        if (settings.dayOfWeek !== undefined) {
          const currentDay = nextRun.getDay();
          const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        }
        break;
      
      case 'monthly':
        if (settings.dayOfMonth !== undefined) {
          nextRun.setDate(settings.dayOfMonth);
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
        }
        break;
    }

    return nextRun;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    createScheduledPost,
    postToLinkedIn,
    fetchPosts,
  };
}
