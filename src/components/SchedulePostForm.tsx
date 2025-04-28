
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Loader2 } from 'lucide-react';
import type { ScheduleSettings } from '@/hooks/useScheduleSettings';

interface SchedulePostFormProps {
  onSchedule: (settings: ScheduleSettings) => Promise<void>;
  initialValues?: ScheduleSettings;
  isUpdating?: boolean;
}

// Common timezones list
const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
];

const SchedulePostForm: React.FC<SchedulePostFormProps> = ({ onSchedule, initialValues, isUpdating = false }) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setFrequency(initialValues.frequency);
      setTimeOfDay(initialValues.timeOfDay);
      if (initialValues.dayOfWeek !== undefined) setDayOfWeek(initialValues.dayOfWeek);
      if (initialValues.dayOfMonth !== undefined) setDayOfMonth(initialValues.dayOfMonth);
      setTimezone(initialValues.timezone || 'Asia/Kolkata');
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSchedule({
        frequency,
        timeOfDay,
        ...(frequency === 'weekly' && { dayOfWeek }),
        ...(frequency === 'monthly' && { dayOfMonth }),
        timezone,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={isUpdating || isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {commonTimezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Frequency</Label>
            <RadioGroup
              value={frequency}
              onValueChange={(value) => setFrequency(value as 'daily' | 'weekly' | 'monthly')}
              className="grid grid-cols-3 gap-4"
              disabled={isUpdating || isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Daily</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Weekly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeOfDay">Time of Day</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <input
                id="timeOfDay"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={isUpdating || isSubmitting}
              />
            </div>
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select 
                value={dayOfWeek.toString()} 
                onValueChange={(value) => setDayOfWeek(parseInt(value))}
                disabled={isUpdating || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Day of Month</Label>
              <Select 
                value={dayOfMonth.toString()} 
                onValueChange={(value) => setDayOfMonth(parseInt(value))}
                disabled={isUpdating || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isUpdating || isSubmitting}
          >
            {isUpdating || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating all schedules...
              </>
            ) : (
              'Update Schedule'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SchedulePostForm;
