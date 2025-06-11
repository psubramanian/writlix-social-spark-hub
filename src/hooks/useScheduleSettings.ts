
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
import { calculateNextRunTime } from '@/utils/scheduleUtils';

export interface ScheduleSettings {
  id?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone?: string;
  nextRunAt?: string;
}

export function useScheduleSettings() {
  const [userSettings, setUserSettings] = useState<ScheduleSettings | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();

  const fetchUserSettings = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return;
      }

      const { data: settings, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('user_id', user.id as any)
        .is('post_id', null)
        .maybeSingle();

      if (error) {
        console.error('Error fetching schedule settings:', error);
        return;
      }

      if (settings && typeof settings === 'object' && 'id' in settings && 'frequency' in settings && 'time_of_day' in settings) {
        setUserSettings({
          id: String(settings.id),
          frequency: settings.frequency as 'daily' | 'weekly' | 'monthly',
          timeOfDay: String(settings.time_of_day),
          dayOfWeek: ('day_of_week' in settings && settings.day_of_week !== null) ? Number(settings.day_of_week) : undefined,
          dayOfMonth: ('day_of_month' in settings && settings.day_of_month !== null) ? Number(settings.day_of_month) : undefined,
          timezone: ('timezone' in settings && settings.timezone) ? String(settings.timezone) : 'UTC',
          nextRunAt: ('next_run_at' in settings && settings.next_run_at) ? String(settings.next_run_at) : undefined,
        });
      }
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
    }
  };

  const updateUserSettings = async (newSettings: Omit<ScheduleSettings, 'id' | 'nextRunAt'>) => {
    setIsUpdating(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return false;
      }

      // Calculate next run time based on new settings
      const nextRunAt = calculateNextRunTime({
        frequency: newSettings.frequency,
        timeOfDay: newSettings.timeOfDay,
        dayOfWeek: newSettings.dayOfWeek,
        dayOfMonth: newSettings.dayOfMonth,
        timezone: newSettings.timezone || 'UTC',
      });

      const settingsData = {
        user_id: user.id,
        frequency: newSettings.frequency,
        time_of_day: newSettings.timeOfDay,
        day_of_week: newSettings.dayOfWeek,
        day_of_month: newSettings.dayOfMonth,
        timezone: newSettings.timezone || 'UTC',
        next_run_at: nextRunAt.toISOString(),
      };

      if (userSettings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('schedule_settings')
          .update(settingsData as any)
          .eq('id', userSettings.id as any);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('schedule_settings')
          .insert(settingsData as any);

        if (error) throw error;
      }

      // Update all existing scheduled posts to use the new timezone
      const { error: updatePostsError } = await supabase
        .from('scheduled_posts')
        .update({ timezone: newSettings.timezone || 'UTC' } as any)
        .eq('user_id', user.id as any);

      if (updatePostsError) {
        console.error('Error updating posts timezone:', updatePostsError);
        // Don't throw - settings were saved successfully
      }

      await fetchUserSettings();

      toast({
        title: "Schedule Updated",
        description: "Your posting schedule has been updated successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating schedule settings:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  return {
    userSettings,
    fetchUserSettings,
    updateUserSettings,
    isUpdating,
  };
}
