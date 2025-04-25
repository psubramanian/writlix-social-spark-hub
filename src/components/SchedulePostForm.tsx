
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface SchedulePostFormProps {
  onSchedule: (contentId: number, settings: {
    frequency: 'daily' | 'weekly' | 'monthly';
    timeOfDay: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  }) => void;
}

const SchedulePostForm: React.FC<SchedulePostFormProps> = ({ onSchedule }) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [contentId, setContentId] = useState<number | null>(null);
  const [availableContent, setAvailableContent] = useState<Array<{ id: number, title: string }>>([]);

  useEffect(() => {
    fetchAvailableContent();
  }, []);

  const fetchAvailableContent = async () => {
    const { data, error } = await supabase
      .from('content_ideas')
      .select('id, title')
      .eq('status', 'Review');
    
    if (error) {
      console.error('Error fetching content:', error);
      return;
    }
    
    setAvailableContent(data || []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentId) return;
    
    onSchedule(contentId, {
      frequency,
      timeOfDay,
      ...(frequency === 'weekly' && { dayOfWeek }),
      ...(frequency === 'monthly' && { dayOfMonth }),
    });

    // Reset form
    setContentId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Select Content</Label>
            <Select
              value={contentId?.toString()}
              onValueChange={(value) => setContentId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content to schedule" />
              </SelectTrigger>
              <SelectContent>
                {availableContent.map((content) => (
                  <SelectItem key={content.id} value={content.id.toString()}>
                    {content.title}
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
            <input
              id="timeOfDay"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
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

          <Button 
            type="submit" 
            className="w-full"
            disabled={!contentId}
          >
            Schedule Post
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SchedulePostForm;
