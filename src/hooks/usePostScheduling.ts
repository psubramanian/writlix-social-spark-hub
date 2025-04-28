
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
      let { data: userSettings, error: settingsError } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id)
        .is('post_id', null)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
        throw settingsError;
      }
      
      if (!userSettings) {
        console.error('No schedule settings found, creating default settings');
        
        // Create default settings with tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const defaultSettings = {
          user_id: user.id,
          frequency: 'daily' as const,
          time_of_day: '09:00:00',
          timezone: 'UTC',
          next_run_at: tomorrow.toISOString()
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
        
        // Use the newly created settings
        userSettings = newSettings;
      }
      
      console.log('Using schedule settings:', userSettings);

      // 1. Get the current next_run_at value from the schedule settings
      // This is the slot we'll use for this post
      const nextAvailableSlot = userSettings.next_run_at;
      if (!nextAvailableSlot) {
        console.error('No next_run_at value found in schedule settings');
        throw new Error('Failed to determine when to schedule the post');
      }

      console.log(`Next available scheduling slot: ${nextAvailableSlot}`);

      // 2. Create the scheduled post with the next available slot
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          content_id: contentId,
          status: 'pending',
          next_run_at: nextAvailableSlot,
          timezone: userSettings.timezone || 'UTC'
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating scheduled post:', postError);
        throw postError;
      }

      console.log('Post scheduled successfully:', postData);

      // 3. Calculate the next available slot based on frequency
      const updatedNextRunAt = calculateNextRunTime({
        frequency: userSettings.frequency,
        timeOfDay: userSettings.time_of_day,
        dayOfWeek: userSettings.day_of_week,
        dayOfMonth: userSettings.day_of_month,
        timezone: userSettings.timezone || 'UTC'
      }, 1); // Just increment by 1 unit (day, week, or month)

      // Ensure we have a valid date
      if (!updatedNextRunAt || isNaN(updatedNextRunAt.getTime())) {
        console.error('Invalid next run time calculated for settings update:', updatedNextRunAt);
        throw new Error('Failed to calculate valid next schedule time');
      }

      const updatedNextRunAtString = updatedNextRunAt.toISOString();
      console.log(`Updated next available slot: ${updatedNextRunAtString}`);

      // 4. Update the schedule settings with the new next_run_at
      const { error: updateError } = await supabase
        .from('schedule_settings')
        .update({ next_run_at: updatedNextRunAtString })
        .eq('id', userSettings.id);

      if (updateError) {
        console.error('Error updating schedule settings:', updateError);
        // We don't throw here as the post is already scheduled
        // But we should log this error
      }

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
