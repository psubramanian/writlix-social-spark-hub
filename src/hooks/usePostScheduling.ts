
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
      
      // If no user settings exist, create default settings
      if (!userSettings) {
        console.log('No schedule settings found, creating default settings');
        
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
        
        console.log('Creating default settings with next_run_at:', defaultSettings.next_run_at);
        
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

      // CRITICAL VALIDATION: Ensure next_run_at exists and is valid
      let nextAvailableSlot = userSettings.next_run_at;
      
      // If next_run_at is missing or invalid, generate a new one
      if (!nextAvailableSlot || typeof nextAvailableSlot !== 'string') {
        console.warn('Invalid next_run_at found in settings, generating a new one');
        
        // Create a fallback scheduling time (tomorrow)
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 1);
        fallbackDate.setHours(9, 0, 0, 0);
        nextAvailableSlot = fallbackDate.toISOString();
        
        // Update the settings with this valid value
        await supabase
          .from('schedule_settings')
          .update({ next_run_at: nextAvailableSlot })
          .eq('id', userSettings.id);
          
        console.log('Updated settings with fallback next_run_at:', nextAvailableSlot);
      }

      console.log(`Next available scheduling slot: ${nextAvailableSlot}`);
      
      // Validation for empty string or invalid date
      if (nextAvailableSlot === "" || isNaN(new Date(nextAvailableSlot).getTime())) {
        console.error('Invalid date format for next_run_at:', nextAvailableSlot);
        throw new Error('Failed to determine a valid time to schedule the post');
      }

      // Create the scheduled post with the validated next available slot
      const scheduledPostData = {
        user_id: user.id,
        content_id: contentId,
        status: 'pending',
        next_run_at: nextAvailableSlot,  // Using the validated value
        timezone: userSettings.timezone || 'UTC'
      };
      
      console.log('Creating scheduled post with data:', scheduledPostData);
      
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .insert(scheduledPostData)
        .select()
        .single();

      if (postError) {
        console.error('Error creating scheduled post:', postError);
        throw postError;
      }

      console.log('Post scheduled successfully:', postData);

      // Calculate the next available slot based on frequency
      const nextRunSettings = {
        frequency: userSettings.frequency,
        timeOfDay: userSettings.time_of_day,
        dayOfWeek: userSettings.day_of_week,
        dayOfMonth: userSettings.day_of_month,
        timezone: userSettings.timezone || 'UTC'
      };
      
      console.log('Calculating next run time with settings:', nextRunSettings);
      
      const updatedNextRunAt = calculateNextRunTime(nextRunSettings, 1);

      // Ensure we have a valid date
      if (!updatedNextRunAt || isNaN(updatedNextRunAt.getTime())) {
        console.error('Invalid next run time calculated:', updatedNextRunAt);
        // Don't throw - we've already scheduled the post, just don't update the next slot
        // Use a fallback value for the next slot instead
        const fallbackNextRun = new Date();
        fallbackNextRun.setDate(fallbackNextRun.getDate() + 1);
        fallbackNextRun.setHours(9, 0, 0, 0);
        
        const updatedNextRunAtString = fallbackNextRun.toISOString();
        console.log(`Using fallback next run time: ${updatedNextRunAtString}`);
        
        // Update the schedule settings with the new fallback next_run_at
        await supabase
          .from('schedule_settings')
          .update({ next_run_at: updatedNextRunAtString })
          .eq('id', userSettings.id);
      } else {
        const updatedNextRunAtString = updatedNextRunAt.toISOString();
        console.log(`Updated next available slot: ${updatedNextRunAtString}`);

        // Update the schedule settings with the new next_run_at
        const { error: updateError } = await supabase
          .from('schedule_settings')
          .update({ next_run_at: updatedNextRunAtString })
          .eq('id', userSettings.id);

        if (updateError) {
          console.error('Error updating schedule settings:', updateError);
          // We don't throw here as the post is already scheduled
          // But we should log this error
        }
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
