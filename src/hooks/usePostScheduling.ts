
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
        // Create default settings if none exist
        const defaultSettings = {
          user_id: user.id,
          frequency: 'daily' as const, // Explicitly typed as 'daily'
          time_of_day: '09:00:00',
          timezone: 'UTC',
          next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        };
        
        const { data: newSettings, error: newSettingsError } = await supabase
          .from('schedule_settings')
          .insert(defaultSettings)
          .select()
          .single();
          
        if (newSettingsError) {
          console.error('Error creating default settings:', newSettingsError);
          throw new Error("Could not create default user schedule settings");
        }
        
        console.log('Created default user settings:', newSettings);
      }

      const userSettings = settings || {
        frequency: 'daily' as const, // Explicitly typed as 'daily'
        time_of_day: '09:00:00',
        timezone: 'UTC'
      };
      
      console.log('Found user settings:', userSettings);

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
        frequency: userSettings.frequency,
        timeOfDay: userSettings.time_of_day,
        dayOfWeek: 'day_of_week' in userSettings ? userSettings.day_of_week : undefined,
        dayOfMonth: 'day_of_month' in userSettings ? userSettings.day_of_month : undefined,
        timezone: userSettings.timezone || 'UTC'
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
          timezone: userSettings.timezone || 'UTC'
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
