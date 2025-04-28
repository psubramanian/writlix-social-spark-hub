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
  
  try {
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
    
    console.log('Base next run time (before applying frequency):', nextRun.toISOString());
    
    // Apply frequency specific adjustments
    switch (settings.frequency) {
      case "daily":
        // For daily frequency, simply add the offset in days
        nextRun.setDate(nextRun.getDate() + daysOffset);
        break;

      case "weekly":
        if (settings.dayOfWeek !== undefined) {
          // Get current day of week (0-6, where 0 is Sunday)
          const currentDay = nextRun.getDay();
          // Calculate days until target day of week
          const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
          
          // If the target day is today but time has passed, add a week
          if (daysUntilTarget === 0 && nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 7);
          } else {
            // Otherwise adjust to the target day
            nextRun.setDate(nextRun.getDate() + daysUntilTarget);
          }
          
          // Add offset in weeks
          if (daysOffset > 0) {
            nextRun.setDate(nextRun.getDate() + (daysOffset * 7));
          }
        }
        break;

      case "monthly":
        if (settings.dayOfMonth !== undefined) {
          // First, set to the specified day of the current month
          const originalDate = nextRun.getDate();
          nextRun.setDate(Math.min(settings.dayOfMonth, getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1)));
          
          // If this date is in the past or it's today but time has passed, move to next month
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
            // Make sure we get a valid date for the target day in the new month
            nextRun.setDate(Math.min(settings.dayOfMonth, getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1)));
          }
          
          // Add offset months
          if (daysOffset > 0) {
            nextRun.setMonth(nextRun.getMonth() + daysOffset);
            // Again, ensure valid date when changing months
            nextRun.setDate(Math.min(settings.dayOfMonth, getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1)));
          }
        }
        break;
    }
    
    console.log('Final calculated next run time:', nextRun.toISOString());
    
    // Validate date before returning
    if (isNaN(nextRun.getTime())) {
      console.error('Invalid date calculated:', nextRun);
      // Return a safe default (tomorrow at 9am) if calculation failed
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1);
      fallback.setHours(9, 0, 0, 0);
      return fallback;
    }
    
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    // Return a safe default (tomorrow at 9am) if calculation failed
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
  }
};

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
