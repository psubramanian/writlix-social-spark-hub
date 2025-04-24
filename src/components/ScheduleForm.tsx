
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduleFormProps {
  onSchedule: (formData: any) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSchedule }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState('once');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      title,
      date,
      time,
      frequency,
    };
    
    onSchedule(formData);
    
    // Reset form
    setTitle('');
    setDate('');
    setTime('');
    setFrequency('once');
  };
  
  // Get tomorrow's date in YYYY-MM-DD format as the min date for the calendar
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Post Title</Label>
        <Input
          id="title"
          placeholder="Enter post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          min={getTomorrowDate()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="time">Time</Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select 
          value={frequency} 
          onValueChange={(value) => setFrequency(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Once</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" className="w-full">
        Schedule Post
      </Button>
    </form>
  );
};

export default ScheduleForm;
