
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
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
      const { data: userSettings, error: settingsError } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id as any)
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
          .insert(defaultSettings as any)
          .select()
          .single();
          
        if (newSettingsError) {
          console.error('Error creating default settings:', newSettingsError);
          throw new Error("Could not create default user schedule settings");
        }
        
        console.log('Created default user settings:', newSettings);
        
        // Use the newly created settings - but check if it exists first
        if (!newSettings || typeof newSettings !== 'object') {
          throw new Error('Failed to create default settings');
        }
        
        // Type guard for newSettings - ensure it's not null before accessing properties
        if (!('next_run_at' in newSettings) || !('timezone' in newSettings)) {
          throw new Error('Invalid settings data structure');
        }
          
        // CRITICAL VALIDATION: Ensure next_run_at exists and is valid
        const nextAvailableSlot = String(newSettings.next_run_at);
        
        console.log(`Next available scheduling slot: ${nextAvailableSlot}`);
        
        // Validation for empty string or invalid date
        if (!nextAvailableSlot || nextAvailableSlot === "" || isNaN(new Date(nextAvailableSlot).getTime())) {
          console.error('Invalid date format for next_run_at:', nextAvailableSlot);
          throw new Error('Failed to determine a valid time to schedule the post');
        }

        // Create the scheduled post with the validated next available slot
        const scheduledPostData = {
          user_id: user.id,
          content_id: contentId,
          status: 'pending',
          next_run_at: nextAvailableSlot,
          timezone: String(newSettings.timezone) || 'UTC'
        };
        
        console.log('Creating scheduled post with data:', scheduledPostData);
        
        const { data: postData, error: postError } = await supabase
          .from('scheduled_posts')
          .insert(scheduledPostData as any)
          .select()
          .single();

        if (postError) {
          console.error('Error creating scheduled post:', postError);
          throw postError;
        }

        console.log('Post scheduled successfully:', postData);
        
        // Successfully created with new settings
        return true;
      }

      // We have existing user settings - proceed with them
      console.log('Using existing schedule settings:', userSettings);

      // Type guard for userSettings - ensure it's not null before accessing properties
      if (!('next_run_at' in userSettings) || !('timezone' in userSettings)) {
        throw new Error('Invalid user settings data structure');
      }

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
        if ('id' in userSettings && userSettings.id) {
          await supabase
            .from('schedule_settings')
            .update({ next_run_at: nextAvailableSlot } as any)
            .eq('id', userSettings.id as any);
        }
          
        console.log('Updated settings with fallback next_run_at:', nextAvailableSlot);
      }

      console.log(`Next available scheduling slot: ${nextAvailableSlot}`);
      
      // Validation for empty string or invalid date
      if (nextAvailableSlot === "" || isNaN(new Date(String(nextAvailableSlot)).getTime())) {
        console.error('Invalid date format for next_run_at:', nextAvailableSlot);
        throw new Error('Failed to determine a valid time to schedule the post');
      }

      // Create the scheduled post with the validated next available slot
      const scheduledPostData = {
        user_id: user.id,
        content_id: contentId,
        status: 'pending',
        next_run_at: String(nextAvailableSlot),
        timezone: String(userSettings.timezone) || 'UTC'
      };
      
      console.log('Creating scheduled post with data:', scheduledPostData);
      
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .insert(scheduledPostData as any)
        .select()
        .single();

      if (postError) {
        console.error('Error creating scheduled post:', postError);
        throw postError;
      }

      console.log('Post scheduled successfully:', postData);

      // Calculate the next available slot based on frequency if we have valid settings
      if ('frequency' in userSettings && 'time_of_day' in userSettings && userSettings.frequency && userSettings.time_of_day) {
        const frequency = userSettings.frequency;
        const timeOfDay = userSettings.time_of_day;
        
        if (frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') {
          const nextRunSettings = {
            frequency: frequency as 'daily' | 'weekly' | 'monthly',
            timeOfDay: String(timeOfDay),
            dayOfWeek: ('day_of_week' in userSettings && userSettings.day_of_week !== null) ? Number(userSettings.day_of_week) : undefined,
            dayOfMonth: ('day_of_month' in userSettings && userSettings.day_of_month !== null) ? Number(userSettings.day_of_month) : undefined,
            timezone: String(userSettings.timezone) || 'UTC'
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
            if ('id' in userSettings && userSettings.id) {
              await supabase
                .from('schedule_settings')
                .update({ next_run_at: updatedNextRunAtString } as any)
                .eq('id', userSettings.id as any);
            }
          } else {
            const updatedNextRunAtString = updatedNextRunAt.toISOString();
            console.log(`Updated next available slot: ${updatedNextRunAtString}`);

            // Update the schedule settings with the new next_run_at
            if ('id' in userSettings && userSettings.id) {
              const { error: updateError } = await supabase
                .from('schedule_settings')
                .update({ next_run_at: updatedNextRunAtString } as any)
                .eq('id', userSettings.id as any);

              if (updateError) {
                console.error('Error updating schedule settings:', updateError);
                // We don't throw here as the post is already scheduled
                // But we should log this error
              }
            }
          }
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
