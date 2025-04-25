
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface SchedulePostFormProps {
  onSchedule: (settings: {
    frequency: 'daily' | 'weekly' | 'monthly';
    timeOfDay: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  }) => void;
}

const SchedulePostForm: React.FC<SchedulePostFormProps> = ({ onSchedule }) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSchedule({
      frequency,
      timeOfDay,
      ...(frequency === 'weekly' && { dayOfWeek }),
      ...(frequency === 'monthly' && { dayOfMonth }),
      timezone,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {Intl.supportedValuesOf('timeZone').map((tz) => (
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
              />
            </div>
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select 
                value={dayOfWeek.toString()} 
                onValueChange={(value) => setDayOfWeek(parseInt(value))}
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
                  <SelectItem value="7">Sunday</SelectItem>
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

          <Button type="submit" className="w-full">
            Schedule Post
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SchedulePostForm;
