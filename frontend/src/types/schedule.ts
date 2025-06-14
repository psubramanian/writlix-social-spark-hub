
export interface ScheduleSettings {
  id?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone?: string;
  nextRunAt?: string;
}
