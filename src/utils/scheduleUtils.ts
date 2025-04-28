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
  // Parse the time of day
  const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
  
  // Start with current time in the user's timezone
  let nextRun = new Date();
  nextRun = new Date(nextRun.toLocaleString('en-US', { timeZone: settings.timezone }));
  nextRun.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, start from tomorrow
  const now = new Date();
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  switch (settings.frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + daysOffset);
      break;

    case 'weekly':
      if (settings.dayOfWeek !== undefined) {
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilTarget + (daysOffset * 7));
      }
      break;

    case 'monthly':
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

  return nextRun;
};
