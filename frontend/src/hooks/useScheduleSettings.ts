
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
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

export function useScheduleSettings(userId: string | undefined) {
  const [userSettings, setUserSettings] = useState<ScheduleSettings | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchUserSettings = async () => {
    try {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view schedule settings.",
          variant: "destructive",
        });
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/schedule-settings?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        // No settings found yet - this is expected for new users
        setUserSettings(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch schedule settings' }));
        throw new Error(errorData.message || 'Failed to fetch schedule settings');
      }

      const settings = await response.json();
      console.log('Fetched schedule settings:', settings);

      if (settings && typeof settings === 'object') {
        setUserSettings({
          id: settings.SK || settings.id, // Use SK from DynamoDB or fallback to id
          frequency: settings.frequency as 'daily' | 'weekly' | 'monthly',
          timeOfDay: settings.timeOfDay,
          dayOfWeek: settings.dayOfWeek !== undefined ? Number(settings.dayOfWeek) : undefined,
          dayOfMonth: settings.dayOfMonth !== undefined ? Number(settings.dayOfMonth) : undefined,
          timezone: settings.timezone || 'UTC',
          nextRunAt: settings.nextRunAt,
        });
      }
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule settings.",
        variant: "destructive",
      });
    }
  };

  const updateUserSettings = async (newSettings: Omit<ScheduleSettings, 'id' | 'nextRunAt'>) => {
    setIsUpdating(true);
    try {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update schedule settings.",
          variant: "destructive",
        });
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
        userId: userId,
        frequency: newSettings.frequency,
        timeOfDay: newSettings.timeOfDay,
        dayOfWeek: newSettings.dayOfWeek,
        dayOfMonth: newSettings.dayOfMonth,
        timezone: newSettings.timezone || 'UTC',
        nextRunAt: nextRunAt.toISOString(),
      };

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      
      // Use PUT for both create and update
      const response = await fetch(`${API_BASE_URL}/api/schedule-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update schedule settings' }));
        throw new Error(errorData.message || 'Failed to update schedule settings');
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
