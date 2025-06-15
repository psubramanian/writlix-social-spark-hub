
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
// import { supabase } from '@/integrations/supabase/client'; // To be replaced by API calls
// import { useAuthRedirect } from '@/utils/supabaseUserUtils'; // Clerk will handle auth redirects at component level
import { calculateNextRunTime } from '@/utils/scheduleUtils';
import type { ScheduleSettings } from './useScheduleSettings'; // Ensure this type aligns with DynamoDB/API response

// Define a type for the expected API response for a scheduled post (matches DynamoDB structure)
interface ScheduledPost {
  PK: string; // USER#<userId>
  SK: string; // SCHEDULED_POST#<platform>#<uuid>
  userId: string;
  platform: string;
  contentIdeaId: string; // Or the actual content if denormalized
  scheduledAtUTC: string; // ISO string
  status: 'pending' | 'posted' | 'failed';
  // add other relevant fields from your DynamoDB scheduled_post item
  createdAt?: string;
  updatedAt?: string;
  postId?: string; // Social media post ID after successful posting
  errorMessage?: string;
  timezone?: string; // User's original timezone for the schedule
}

// Define a type for ScheduleSettings, assuming it might come from an API now
// This should align with what your backend API for schedule_settings returns
// For now, we'll keep it similar to the existing one, but it might need adjustments.
interface ApiScheduleSettings extends ScheduleSettings {
  // Potentially add PK/SK or other DynamoDB specific fields if API returns them directly
  // Or ensure the API transforms DynamoDB items into this existing ScheduleSettings structure.
  id?: string; // If 'id' is used as a primary key for settings in DynamoDB or API
}


export function usePostScheduling(userId: string | undefined) {
  const { toast } = useToast();
  // const { redirectToLogin } = useAuthRedirect(); // Removed, Clerk handles auth state

  const scheduleContentIdea = async (contentIdeaId: string, platform: string, contentText: string /* or other content identifiers */) => {
    try {
      if (!userId) {
        // redirectToLogin(); // Component using this hook should handle this based on Clerk's useUser()
        toast({
          title: "User not authenticated",
          description: "Please log in to schedule posts.",
          variant: "destructive",
        });
        return false;
      }

      console.log(`Scheduling content idea with ID: ${contentIdeaId} for user: ${userId} on platform: ${platform}`);

      // API Call: Get user's default schedule settings
      let userSettings: ApiScheduleSettings | null = null;
      try {
        const settingsResponse = await fetch(`/api/schedule-settings?userId=${userId}`); // Adjust API path as needed
        if (!settingsResponse.ok) {
          const errorData = await settingsResponse.json().catch(() => ({ message: 'Failed to fetch schedule settings' }));
          throw new Error(errorData.message || 'Failed to fetch schedule settings');
        }
        userSettings = await settingsResponse.json();
      } catch (settingsError: any) {
        console.error('Error fetching settings via API:', settingsError);
        // throw settingsError; // Decide if this should be a fatal error or if defaults can still be created
        // For now, we'll allow proceeding to create default settings if fetch fails or returns null/empty
        toast({
          title: "Could not fetch schedule settings",
          description: settingsError.message + ". Attempting to use/create defaults.",
          variant: "default", // Changed from "warning" as it's not a standard variant
        });
      }
      
      // If no user settings exist, create default settings
      if (!userSettings) {
        console.log('No schedule settings found, creating default settings');
        
        // Create default settings with tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const defaultSettingsPayload = {
          userId: userId,
          frequency: 'daily' as const,
          timeOfDay: '09:00:00', // Ensure this matches backend expectations
          timezone: 'UTC', // Consider making this user-configurable
          // nextRunAt: tomorrow.toISOString(), // Backend should ideally calculate initial nextRunAt
        };

        console.log('Attempting to create default settings via API with payload:', defaultSettingsPayload);
        
        const createSettingsResponse = await fetch('/api/schedule-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultSettingsPayload),
        });

        if (!createSettingsResponse.ok) {
          const errorData = await createSettingsResponse.json().catch(() => ({ message: 'Failed to create default schedule settings' }));
          console.error('Error creating default settings via API:', errorData.message);
          throw new Error(errorData.message || "Could not create default user schedule settings");
        }
        
        const newSettings: ApiScheduleSettings = await createSettingsResponse.json();
        console.log('Created default user settings via API:', newSettings);

        if (!newSettings || typeof newSettings !== 'object' || !newSettings.nextRunAt || !newSettings.timezone) {
          console.error('Invalid or incomplete default settings data received from API:', newSettings);
          throw new Error('Failed to create or retrieve valid default settings from API.');
        }
        
        const nextAvailableSlot = String(newSettings.nextRunAt);
        console.log(`Next available scheduling slot from new default settings: ${nextAvailableSlot}`);

        if (!nextAvailableSlot || isNaN(new Date(nextAvailableSlot).getTime())) {
          console.error('Invalid date format for nextRunAt in new default settings from API:', nextAvailableSlot);
          throw new Error('API provided an invalid time to schedule the post after creating default settings');
        }

        // Create the scheduled post with the validated next available slot
        // API Call: Create the scheduled post
        const scheduledPostPayload = {
          userId: userId,
          contentIdeaId: contentIdeaId,
          platform: platform,
          // textContent: contentText, // Or send contentIdeaId and let backend fetch content
          scheduledAtUTC: nextAvailableSlot, // This is the 'nextRunAt' from settings
          timezone: String(newSettings.timezone) || 'UTC',
          status: 'pending' // Backend should set initial status
        };
        
        console.log('Creating scheduled post via API with payload:', scheduledPostPayload);
        
        const postResponse = await fetch('/api/scheduled-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduledPostPayload),
        });

        if (!postResponse.ok) {
          const errorData = await postResponse.json().catch(() => ({ message: 'Failed to schedule post' }));
          console.error('Error creating scheduled post via API:', errorData.message);
          throw new Error(errorData.message || 'Failed to schedule post');
        }

        const postData: ScheduledPost = await postResponse.json();
        console.log('Post scheduled successfully via API:', postData);
        
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
      }

      if (!nextAvailableSlot || isNaN(new Date(String(nextAvailableSlot)).getTime())) {
        console.error('Invalid date format for nextRunAt in existing settings:', nextAvailableSlot);
        throw new Error('Failed to determine a valid time to schedule the post from existing settings');
      }

      // API Call: Create the scheduled post
      const scheduledPostPayload = {
        userId: userId,
        contentIdeaId: contentIdeaId,
        platform: platform,
        // textContent: contentText, // Or send contentIdeaId and let backend fetch content
        scheduledAtUTC: String(nextAvailableSlot),
        timezone: String(userSettings.timezone) || 'UTC',
        status: 'pending' // Backend should set initial status
      };
      
      console.log('Creating scheduled post via API with payload:', scheduledPostPayload);
      
      const postResponse = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduledPostPayload),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json().catch(() => ({ message: 'Failed to schedule post' }));
        console.error('Error creating scheduled post via API:', errorData.message);
        throw new Error(errorData.message || 'Failed to schedule post');
      }

      const postData: ScheduledPost = await postResponse.json();
      console.log('Post scheduled successfully via API:', postData);

      // Calculate the next available slot based on frequency if we have valid settings
      if ('frequency' in userSettings && 'timeOfDay' in userSettings && userSettings.frequency && userSettings.timeOfDay) {
        const frequency = userSettings.frequency;
        const timeOfDay = userSettings.timeOfDay;
        
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
            
            // API Call: Update the schedule settings with the new fallback next_run_at
            if (userSettings.id) { // Assuming 'id' is the identifier for schedule settings
              try {
                const updateSettingsResponse = await fetch(`/api/schedule-settings/${userSettings.id}`, { // Or a general update endpoint
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nextRunAt: updatedNextRunAtString }),
                });
                if (!updateSettingsResponse.ok) {
                  console.warn('Failed to update schedule settings with fallback next run time via API.');
                }
              } catch (updateError) {
                console.warn('Error calling API to update schedule settings with fallback:', updateError);
              }
            }
          } else {
            const updatedNextRunAtString = updatedNextRunAt.toISOString();
            console.log(`Updated next available slot: ${updatedNextRunAtString}`);

            // API Call: Update the schedule settings with the new next_run_at
            if (userSettings.id) { // Assuming 'id' is the identifier for schedule settings
              try {
                const updateSettingsResponse = await fetch(`/api/schedule-settings/${userSettings.id}`, { // Or a general update endpoint
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ nextRunAt: updatedNextRunAtString }),
                });
                if (!updateSettingsResponse.ok) {
                    console.error('Error updating schedule settings via API:', await updateSettingsResponse.text());
                     // We don't throw here as the post is already scheduled
                }
              } catch (updateError) {
                console.error('Error calling API to update schedule settings:', updateError);
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
