
// Default schedule settings for all users
export const DEFAULT_SCHEDULE_SETTINGS = {
  frequency: 'daily' as const,
  timeOfDay: '09:00',
  dayOfWeek: undefined as number | undefined,
  dayOfMonth: undefined as number | undefined,
  timezone: 'Asia/Kolkata', // India timezone
};

// Function to calculate the next run time based on schedule settings
export const calculateNextRunTime = (settings: {
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}): Date => {
  const now = new Date();
  const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
  let nextRun = new Date(now);
  
  // Set time
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  switch (settings.frequency) {
    case 'daily':
      // Already handled above
      break;
    
    case 'weekly':
      if (settings.dayOfWeek !== undefined) {
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      }
      break;
    
    case 'monthly':
      if (settings.dayOfMonth !== undefined) {
        nextRun.setDate(settings.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;
  }

  return nextRun;
};
