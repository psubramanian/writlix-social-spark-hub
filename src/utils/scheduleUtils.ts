
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
}, daysOffset: number = 0): Date => {
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
      // Add the offset for sequential scheduling
      nextRun.setDate(nextRun.getDate() + daysOffset);
      break;
    
    case 'weekly':
      if (settings.dayOfWeek !== undefined) {
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
        
        // For weekly, we add weeks based on the offset
        nextRun.setDate(nextRun.getDate() + daysUntilTarget + (daysOffset * 7));
      }
      break;
    
    case 'monthly':
      if (settings.dayOfMonth !== undefined) {
        // For the first post, we set to the specified day of month
        nextRun.setDate(settings.dayOfMonth);
        
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        
        // For subsequent posts, add months based on the offset
        if (daysOffset > 0) {
          nextRun.setMonth(nextRun.getMonth() + daysOffset);
        }
      }
      break;
  }

  return nextRun;
};
