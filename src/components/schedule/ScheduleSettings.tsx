"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Settings,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import type { ScheduleSettings as ScheduleSettingsType, ScheduleFrequency } from '@/types/schedule';
import { COMMON_TIMEZONES } from '@/types/schedule';

interface ScheduleSettingsProps {
  settings: ScheduleSettingsType | null;
  onSave: (settings: Partial<ScheduleSettingsType>) => Promise<void>;
  isLoading: boolean;
}

const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({
  settings,
  onSave,
  isLoading
}) => {
  const [frequency, setFrequency] = useState<ScheduleFrequency>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timezone, setTimezone] = useState('America/New_York');
  const [isActive, setIsActive] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with settings data
  useEffect(() => {
    if (settings) {
      setFrequency(settings.frequency);
      setTimeOfDay(settings.timeOfDay);
      setDayOfWeek(settings.dayOfWeek || 1);
      setDayOfMonth(settings.dayOfMonth || 1);
      setTimezone(settings.timezone);
      setIsActive(settings.isActive);
      setHasChanges(false);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings) {
      const changed = 
        frequency !== settings.frequency ||
        timeOfDay !== settings.timeOfDay ||
        dayOfWeek !== (settings.dayOfWeek || 1) ||
        dayOfMonth !== (settings.dayOfMonth || 1) ||
        timezone !== settings.timezone ||
        isActive !== settings.isActive;
      
      setHasChanges(changed);
    }
  }, [frequency, timeOfDay, dayOfWeek, dayOfMonth, timezone, isActive, settings]);

  const handleSave = async () => {
    const updatedSettings: Partial<ScheduleSettingsType> = {
      frequency,
      timeOfDay,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      timezone,
      isActive,
    };

    await onSave(updatedSettings);
    setHasChanges(false);
  };

  const getFrequencyDescription = () => {
    if (!settings) return '';
    
    const time = new Date(`2000-01-01T${timeOfDay}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const tz = COMMON_TIMEZONES.find(t => t.value === timezone)?.label || timezone;

    switch (frequency) {
      case 'daily':
        return `Daily at ${time} (${tz})`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[dayOfWeek]} at ${time} (${tz})`;
      case 'monthly':
        const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
        return `Monthly on the ${dayOfMonth}${suffix} at ${time} (${tz})`;
      default:
        return '';
    }
  };

  const getNextPostTime = () => {
    if (!settings?.nextRunAt) return null;
    
    return settings.nextRunAt.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!settings) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-blue-900 text-sm">No Schedule Configured</h3>
          </div>
          <p className="text-xs text-blue-700">
            Set up your posting schedule to automatically publish your content to social media.
          </p>
        </div>
        
        <Button 
          onClick={() => onSave({ frequency: 'daily', timeOfDay: '09:00', timezone: 'America/New_York', isActive: true })}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-8 text-sm"
        >
          Create Schedule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current Schedule Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-700 text-sm">Current Schedule</h3>
          <Badge 
            className={`text-xs px-2 py-1 ${isActive 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              {isActive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span className="text-xs">{isActive ? 'Active' : 'Paused'}</span>
            </div>
          </Badge>
        </div>
        
        <div className="bg-white/60 border border-purple-200/50 rounded-lg p-3">
          <p className="text-sm font-medium text-slate-700 mb-2">
            {getFrequencyDescription()}
          </p>
          {getNextPostTime() && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              Next: {getNextPostTime()}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Configuration */}
      <div className="space-y-3">
        <h4 className="font-medium text-slate-700 text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuration
        </h4>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Posting Frequency</label>
          <Select value={frequency} onValueChange={(value: ScheduleFrequency) => setFrequency(value)}>
            <SelectTrigger className="border-purple-200 focus:border-purple-400 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Day of Week (for weekly) */}
        {frequency === 'weekly' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Day of Week</label>
            <Select value={dayOfWeek.toString()} onValueChange={(value) => setDayOfWeek(parseInt(value))}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Day of Month (for monthly) */}
        {frequency === 'monthly' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Day of Month</label>
            <Select value={dayOfMonth.toString()} onValueChange={(value) => setDayOfMonth(parseInt(value))}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time of Day */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Time of Day</label>
          <input
            type="time"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-purple-200 rounded-md focus:border-purple-400 focus:ring-purple-400/20 focus:ring-2 outline-none transition-colors h-9"
          />
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Timezone</label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="border-purple-200 focus:border-purple-400 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="font-medium text-slate-700 text-sm">Enable Automatic Posting</p>
            <p className="text-xs text-slate-500">Turn on to automatically post according to your schedule</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsActive(!isActive)}
            className={`h-8 text-xs px-3 ${isActive 
              ? 'border-green-300 text-green-700 hover:bg-green-50' 
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-9 text-sm"
        >
          {isLoading ? 'Saving...' : 'Save Schedule'}
        </Button>
      )}
    </div>
  );
};

export default ScheduleSettings;