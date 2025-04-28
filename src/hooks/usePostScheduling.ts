
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

      // Get user's default schedule settings
      const { data: settings, error: settingsError } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id)
        .is('post_id', null)
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (!settings) {
        throw new Error("Could not retrieve user schedule settings");
      }

      // Get existing scheduled posts to determine the appropriate offset
      const { data: existingPosts, error: existingPostsError } = await supabase
        .from('scheduled_posts')
        .select('next_run_at')
        .eq('user_id', user.id)
        .order('next_run_at', { ascending: true });
      
      if (existingPostsError) throw existingPostsError;

      // Calculate the appropriate offset based on existing posts
      const offset = existingPosts?.length || 0;
      
      // Calculate next run time with the determined offset
      const nextRunAt = calculateNextRunTime({
        frequency: settings.frequency,
        timeOfDay: settings.time_of_day,
        dayOfWeek: settings.day_of_week,
        dayOfMonth: settings.day_of_month,
        timezone: settings.timezone || 'UTC'
      }, offset);

      // Create scheduled post with next_run_at directly
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          content_id: contentId,
          status: 'pending',
          next_run_at: nextRunAt.toISOString(),
          timezone: settings.timezone || 'UTC'
        })
        .select()
        .single();

      if (postError) throw postError;

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

  return {
    scheduleContentIdea
  };
}
