
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
  title: string;
  content: string;
  status: string;
  settings?: ScheduleSettings;
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

      // Fetch posts and their schedule settings
      const { data: postsData, error: postsError } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          schedule_settings (
            frequency,
            time_of_day,
            day_of_week,
            day_of_month,
            next_run_at
          )
        `);

      if (postsError) {
        throw postsError;
      }

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

  const createPost = async (title: string, content: string, settings: ScheduleSettings) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        navigate('/login');
        return;
      }

      // First, create the post
      const { data: post, error: postError } = await supabase
        .from('scheduled_posts')
        .insert({
          title,
          content,
          user_id: user.id,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Calculate next run time based on schedule settings
      const nextRunAt = calculateNextRunTime(settings);

      // Convert Date object to ISO string for Supabase
      const nextRunAtString = nextRunAt.toISOString();

      // Then, create the schedule settings
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

      await fetchPosts();
      
      toast({
        title: "Post Scheduled",
        description: "Your post has been scheduled successfully.",
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Failed to schedule post",
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
    createPost,
    fetchPosts,
  };
}
