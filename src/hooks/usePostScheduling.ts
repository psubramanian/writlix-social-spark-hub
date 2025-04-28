
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { useAuthRedirect } from '@/utils/supabaseUserUtils';
import { calculateNextRunTime } from '@/utils/scheduleUtils';
import type { ScheduleSettings } from './useScheduleSettings';

export function usePostScheduling() {
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();

  const scheduleContentIdea = async (contentId: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return false;
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

      const settings = await fetchInitialSettings(user.id);
      if (!settings) {
        throw new Error("Could not retrieve user schedule settings");
      }

      // Get existing scheduled posts to determine the appropriate offset
      const { data: existingPosts, error: existingPostsError } = await supabase
        .from('schedule_settings')
        .select('next_run_at')
        .eq('user_id', user.id)
        .order('next_run_at', { ascending: true });
      
      if (existingPostsError) throw existingPostsError;

      // Calculate the appropriate offset based on existing posts
      const offset = calculatePostOffset(settings.frequency, existingPosts?.length || 0);
      
      // Calculate next run time with the determined offset
      const nextRunAt = calculateNextRunTime(settings, offset);

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

      toast({
        title: "Post Scheduled",
        description: "Your content has been scheduled successfully.",
      });

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

  const fetchInitialSettings = async (userId: string) => {
    const { data, error } = await supabase
      .from('schedule_settings')
      .select('*')
      .eq('user_id', userId)
      .is('post_id', null)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return {
        frequency: data.frequency,
        timeOfDay: data.time_of_day,
        dayOfWeek: data.day_of_week ?? undefined,
        dayOfMonth: data.day_of_month ?? undefined,
        timezone: data.timezone || 'UTC'
      } as ScheduleSettings;
    }

    return null;
  };

  // Helper function to calculate the appropriate offset based on frequency
  const calculatePostOffset = (frequency: 'daily' | 'weekly' | 'monthly', existingPostsCount: number): number => {
    // We use the count of existing posts as our base offset
    return existingPostsCount;
  };

  return {
    scheduleContentIdea
  };
}
