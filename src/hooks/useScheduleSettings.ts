
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_SCHEDULE_SETTINGS, calculateNextRunTime } from '@/utils/scheduleUtils';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export interface ScheduleSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}

export function useScheduleSettings() {
  const [userSettings, setUserSettings] = useState<ScheduleSettings>(DEFAULT_SCHEDULE_SETTINGS);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchUserSettings = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const settings = {
          frequency: data.frequency,
          timeOfDay: data.time_of_day,
          dayOfWeek: data.day_of_week ?? undefined,
          dayOfMonth: data.day_of_month ?? undefined,
          timezone: data.timezone || 'UTC'
        } as ScheduleSettings;
        
        setUserSettings(settings);
        return settings;
      } else {
        // Create default settings if none exist
        return await createDefaultSettings(user.id);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      return DEFAULT_SCHEDULE_SETTINGS;
    }
  };

  const createDefaultSettings = async (userId: string) => {
    const nextRunAt = calculateNextRunTime(DEFAULT_SCHEDULE_SETTINGS);
    
    try {
      const { data, error } = await supabase
        .from('schedule_settings')
        .insert({
          user_id: userId,
          frequency: DEFAULT_SCHEDULE_SETTINGS.frequency,
          time_of_day: DEFAULT_SCHEDULE_SETTINGS.timeOfDay,
          day_of_week: DEFAULT_SCHEDULE_SETTINGS.dayOfWeek,
          day_of_month: DEFAULT_SCHEDULE_SETTINGS.dayOfMonth,
          next_run_at: nextRunAt.toISOString(),
          timezone: DEFAULT_SCHEDULE_SETTINGS.timezone
        })
        .select()
        .single();

      if (error) throw error;
      
      setUserSettings(DEFAULT_SCHEDULE_SETTINGS);
      return DEFAULT_SCHEDULE_SETTINGS;
    } catch (error) {
      console.error("Error creating default settings:", error);
      return DEFAULT_SCHEDULE_SETTINGS;
    }
  };

  const updateUserSettings = async (settings: ScheduleSettings) => {
    setIsUpdating(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      console.log('Updating user settings with:', {
        user_id: user.id,
        frequency: settings.frequency,
        time_of_day: settings.timeOfDay,
        day_of_week: settings.dayOfWeek,
        day_of_month: settings.dayOfMonth,
        timezone: settings.timezone
      });

      // Use the functions.invoke method with the update-user-schedule-settings function
      const { data, error: updateError } = await supabase.functions.invoke(
        'update-user-schedule-settings', 
        {
          body: {
            user_id: user.id,
            frequency: settings.frequency,
            time_of_day: settings.timeOfDay,
            day_of_week: settings.dayOfWeek,
            day_of_month: settings.dayOfMonth,
            timezone: settings.timezone
          }
        }
      );

      if (updateError) {
        console.error('Edge function error:', updateError);
        throw new Error(`Failed to update settings: ${updateError.message}`);
      }

      console.log('Settings update response:', data);

      if (!data || data.error) {
        throw new Error(data?.error || 'Unknown error occurred');
      }

      setUserSettings(settings);
      toast({
        title: "Schedule Updated",
        description: `Your posting schedule has been updated successfully. ${data.updatedPostsCount || 0} pending posts were rescheduled.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating schedule settings:", error);
      toast({
        title: "Update Failed",
        description: `Failed to update schedule settings: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    userSettings,
    isUpdating,
    fetchUserSettings,
    updateUserSettings
  };
}
