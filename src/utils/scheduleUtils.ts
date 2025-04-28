
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
  console.log('Calculating next run time with settings:', settings, 'and offset:', daysOffset);
  
  // Parse the time of day
  const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
  
  // Start with current time
  const now = new Date();
  let nextRun = new Date();
  
  // Set the time components
  nextRun.setHours(hours || 9, minutes || 0, 0, 0);
  
  // If the time has already passed today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  console.log('Base next run time (before offset):', nextRun.toISOString());
  
  switch (settings.frequency) {
    case "daily":
      nextRun.setDate(nextRun.getDate() + daysOffset);
      break;

    case "weekly":
      if (settings.dayOfWeek !== undefined) {
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilTarget + (daysOffset * 7));
      }
      break;

    case "monthly":
      if (settings.dayOfMonth !== undefined) {
        nextRun.setDate(settings.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        if (daysOffset > 0) {
          nextRun.setMonth(nextRun.getMonth() + daysOffset);
        }
      }
      break;
  }

  console.log('Final calculated next run time:', nextRun.toISOString());
  return nextRun;
};
