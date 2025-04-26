
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { useAuthRedirect } from '@/utils/supabaseUserUtils';
import { useScheduleSettings, type ScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { calculateNextRunTime } from '@/utils/scheduleUtils';

interface ScheduledPost {
  id: string;
  content_ideas: {
    id: number;
    title: string;
    content: string;
    status: string;
  };
  schedule_settings: {
    id: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time_of_day: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    next_run_at: string;
    timezone: string;
  }[];
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();
  const { userSettings, fetchUserSettings } = useScheduleSettings();
  const { postToLinkedIn } = usePostOperations();

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
          ),
          schedule_settings (
            id,
            frequency,
            time_of_day,
            day_of_week,
            day_of_month,
            next_run_at,
            timezone
          )
        `)
        .eq('user_id', user.id);

      if (postsError) throw postsError;

      const formattedPosts = (postsData || []).map((post: any) => ({
        ...post,
        schedule_settings: post.schedule_settings.map((setting: any) => ({
          ...setting,
          timezone: setting.timezone || 'UTC'
        }))
      }));

      setPosts(formattedPosts as ScheduledPost[]);
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

  const updateAllScheduledPosts = async (settings: ScheduleSettings) => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const { data: postsData, error: postsError } = await supabase
      .from('scheduled_posts')
      .select('id, schedule_settings(id)')
      .eq('user_id', user.id);

    if (postsError) throw postsError;

    if (!postsData || postsData.length === 0) {
      return;
    }

    for (const post of postsData) {
      if (post.schedule_settings && post.schedule_settings.length > 0) {
        for (const setting of post.schedule_settings) {
          const nextRunAt = calculateNextRunTime(settings);
          
          const { error: updateError } = await supabase
            .from('schedule_settings')
            .update({
              frequency: settings.frequency,
              time_of_day: settings.timeOfDay,
              day_of_week: settings.dayOfWeek,
              day_of_month: settings.dayOfMonth,
              next_run_at: nextRunAt.toISOString(),
              timezone: settings.timezone
            })
            .eq('id', setting.id);

          if (updateError) {
            console.error('Error updating setting:', updateError);
          }
        }
      }
    }

    await fetchPosts();
  };

  const scheduleContentIdea = async (contentId: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return false;
      }

      const settings = await fetchUserSettings();
      if (!settings) {
        throw new Error("Could not retrieve user schedule settings");
      }

      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          content_id: contentId,
          status: 'pending'
        })
        .select()
        .single();

      if (postError) throw postError;

      const nextRunAt = calculateNextRunTime(settings);

      const { error: settingsError } = await supabase
        .from('schedule_settings')
        .insert({
          post_id: postData.id,
          user_id: user.id,
          frequency: settings.frequency,
          time_of_day: settings.timeOfDay,
          day_of_week: settings.dayOfWeek,
          day_of_month: settings.dayOfMonth,
          next_run_at: nextRunAt.toISOString(),
          timezone: settings.timezone
        });

      if (settingsError) throw settingsError;

      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error scheduling content:', error);
      toast({
        title: "Failed to schedule content",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createScheduledPost = async (settings: ScheduleSettings) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return;
      }

      await saveUserSettings(settings);
      await updateAllScheduledPosts(settings);
      
      toast({
        title: "Schedule Updated",
        description: "Your schedule has been updated and all scheduled posts have been adjusted.",
      });
    } catch (error: any) {
      console.error('Error creating/updating schedule:', error);
      toast({
        title: "Failed to update schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveUserSettings = async (settings: ScheduleSettings) => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const nextRunAt = calculateNextRunTime(settings);
    const { data, error } = await supabase
      .from('schedule_settings')
      .select('id')
      .eq('user_id', user.id)
      .is('post_id', null)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const { error: updateError } = await supabase
        .from('schedule_settings')
        .update({
          frequency: settings.frequency,
          time_of_day: settings.timeOfDay,
          day_of_week: settings.dayOfWeek,
          day_of_month: settings.dayOfMonth,
          next_run_at: nextRunAt.toISOString(),
          timezone: settings.timezone
        })
        .eq('id', data.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('schedule_settings')
        .insert({
          user_id: user.id,
          post_id: null,
          frequency: settings.frequency,
          time_of_day: settings.timeOfDay,
          day_of_week: settings.dayOfWeek,
          day_of_month: settings.dayOfMonth,
          next_run_at: nextRunAt.toISOString(),
          timezone: settings.timezone
        });

      if (insertError) throw insertError;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const settings = await fetchUserSettings();
      await fetchPosts();
    };
    
    initialize();
  }, []);

  return {
    posts,
    loading,
    createScheduledPost,
    postToLinkedIn,
    fetchPosts,
    scheduleContentIdea,
    userSettings
  };
}
