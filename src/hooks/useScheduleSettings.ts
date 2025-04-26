
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
  const { toast } = useToast();

  const fetchUserSettings = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id)
        .is('post_id', null)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const settings = {
          frequency: data.frequency,
          timeOfDay: data.time_of_day,
          dayOfWeek: data.day_of_week ?? undefined,
          dayOfMonth: data.day_of_month ?? undefined,
          timezone: data.timezone || 'Asia/Kolkata'
        } as ScheduleSettings;
        
        setUserSettings(settings);
        return settings;
      } else {
        const nextRunAt = calculateNextRunTime(DEFAULT_SCHEDULE_SETTINGS);
        
        const { data: newSettings, error: insertError } = await supabase
          .from('schedule_settings')
          .insert({
            user_id: user.id,
            post_id: null,
            frequency: DEFAULT_SCHEDULE_SETTINGS.frequency,
            time_of_day: DEFAULT_SCHEDULE_SETTINGS.timeOfDay,
            day_of_week: DEFAULT_SCHEDULE_SETTINGS.dayOfWeek,
            day_of_month: DEFAULT_SCHEDULE_SETTINGS.dayOfMonth,
            next_run_at: nextRunAt.toISOString(),
            timezone: DEFAULT_SCHEDULE_SETTINGS.timezone
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        setUserSettings(DEFAULT_SCHEDULE_SETTINGS);
        return DEFAULT_SCHEDULE_SETTINGS;
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      return DEFAULT_SCHEDULE_SETTINGS;
    }
  };

  const updateUserSettings = async (settings: ScheduleSettings) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      const nextRunAt = calculateNextRunTime(settings);

      const { error } = await supabase
        .from('schedule_settings')
        .update({
          frequency: settings.frequency,
          time_of_day: settings.timeOfDay,
          day_of_week: settings.dayOfWeek,
          day_of_month: settings.dayOfMonth,
          next_run_at: nextRunAt.toISOString(),
          timezone: settings.timezone
        })
        .eq('user_id', user.id)
        .is('post_id', null);

      if (error) throw error;

      setUserSettings(settings);
      toast({
        title: "Schedule Updated",
        description: "Your posting schedule has been updated successfully.",
      });

      return true;
    } catch (error: any) {
      console.error("Error updating schedule settings:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update schedule settings. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    userSettings,
    fetchUserSettings,
    updateUserSettings
  };
}
