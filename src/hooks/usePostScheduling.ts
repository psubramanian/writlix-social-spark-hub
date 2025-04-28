
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

      console.log(`Scheduling content idea with ID: ${contentId} for user: ${user.id}`);

      // Get user's default schedule settings
      const { data: settings, error: settingsError } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id)
        .is('post_id', null)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
        throw settingsError;
      }
      
      if (!settings) {
        console.error('No schedule settings found');
        throw new Error("Could not retrieve user schedule settings");
      }

      console.log('Found user settings:', settings);

      // Get existing scheduled posts to determine the appropriate offset
      const { data: existingPosts, error: existingPostsError } = await supabase
        .from('scheduled_posts')
        .select('next_run_at')
        .eq('user_id', user.id)
        .order('next_run_at', { ascending: true });
      
      if (existingPostsError) {
        console.error('Error fetching existing posts:', existingPostsError);
        throw existingPostsError;
      }

      // Calculate the appropriate offset based on existing posts
      const offset = existingPosts?.length || 0;
      console.log(`Calculating next run time with offset: ${offset}`);
      
      // Calculate next run time with the determined offset
      const nextRunAt = calculateNextRunTime({
        frequency: settings.frequency,
        timeOfDay: settings.time_of_day,
        dayOfWeek: settings.day_of_week,
        dayOfMonth: settings.day_of_month,
        timezone: settings.timezone || 'UTC'
      }, offset);

      console.log(`Next run time calculated: ${nextRunAt.toISOString()}`);

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

      if (postError) {
        console.error('Error creating scheduled post:', postError);
        throw postError;
      }

      console.log('Post scheduled successfully:', postData);

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
