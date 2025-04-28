
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
    // Ensure we have valid time format
    let hours = 9, minutes = 0;
    
    if (settings.timeOfDay && typeof settings.timeOfDay === 'string') {
      // Handle both "HH:MM" and "HH:MM:SS" formats
      const timeParts = settings.timeOfDay.split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
      
      // Validate parsed values
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time format in settings, using default 9:00');
        hours = 9;
        minutes = 0;
      }
    } else {
      console.warn('Missing timeOfDay in settings, using default 9:00');
    }
    
    // Start with current time
    const now = new Date();
    let nextRun = new Date();
    
    // Set the time components
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, start from tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
      console.log('Time already passed today, scheduling for tomorrow:', nextRun.toISOString());
    }
    
    console.log('Base next run time (before applying frequency):', nextRun.toISOString());
    
    // Apply frequency specific adjustments
    switch (settings.frequency) {
      case "daily":
        // For daily frequency, simply add the offset in days
        nextRun.setDate(nextRun.getDate() + daysOffset);
        console.log('Daily schedule with offset:', daysOffset, 'days, result:', nextRun.toISOString());
        break;

      case "weekly":
        if (settings.dayOfWeek !== undefined && settings.dayOfWeek >= 0 && settings.dayOfWeek <= 6) {
          // Get current day of week (0-6, where 0 is Sunday)
          const currentDay = nextRun.getDay();
          // Calculate days until target day of week
          const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
          
          // If the target day is today but time has passed, add a week
          if (daysUntilTarget === 0 && nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 7);
            console.log('Target day is today but time passed, adding a week:', nextRun.toISOString());
          } else {
            // Otherwise adjust to the target day
            nextRun.setDate(nextRun.getDate() + daysUntilTarget);
            console.log('Adjusted to target day of week:', settings.dayOfWeek, 'result:', nextRun.toISOString());
          }
          
          // Add offset in weeks
          if (daysOffset > 0) {
            nextRun.setDate(nextRun.getDate() + (daysOffset * 7));
            console.log('Added week offset:', daysOffset, 'result:', nextRun.toISOString());
          }
        } else {
          console.warn('Invalid dayOfWeek, treating as daily schedule with weekly increment');
          nextRun.setDate(nextRun.getDate() + (daysOffset * 7));
        }
        break;

      case "monthly":
        if (settings.dayOfMonth !== undefined && settings.dayOfMonth >= 1 && settings.dayOfMonth <= 31) {
          // First, set to the specified day of the current month
          const originalDate = nextRun.getDate();
          const daysInCurrentMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
          
          // Make sure we don't exceed the days in the month
          const targetDay = Math.min(settings.dayOfMonth, daysInCurrentMonth);
          nextRun.setDate(targetDay);
          
          // If this date is in the past or it's today but time has passed, move to next month
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
            // Make sure we get a valid date for the target day in the new month
            const daysInNextMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, daysInNextMonth));
            console.log('Target day is in the past, moved to next month:', nextRun.toISOString());
          }
          
          // Add offset months
          if (daysOffset > 0) {
            nextRun.setMonth(nextRun.getMonth() + daysOffset);
            // Again, ensure valid date when changing months
            const daysInOffsetMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, daysInOffsetMonth));
            console.log('Added month offset:', daysOffset, 'result:', nextRun.toISOString());
          }
        } else {
          console.warn('Invalid dayOfMonth, treating as daily schedule with 30-day increment');
          nextRun.setDate(nextRun.getDate() + (daysOffset * 30));
        }
        break;
        
      default:
        console.warn('Unknown frequency:', settings.frequency, 'defaulting to daily');
        nextRun.setDate(nextRun.getDate() + daysOffset);
    }
    
    console.log('Final calculated next run time:', nextRun.toISOString());
    
    // Final validation to ensure we have a valid date
    if (isNaN(nextRun.getTime())) {
      console.error('Invalid date calculated:', nextRun);
      // Return a safe default (tomorrow at 9am) if calculation failed
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1);
      fallback.setHours(9, 0, 0, 0);
      console.log('Using fallback date:', fallback.toISOString());
      return fallback;
    }
    
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    // Return a safe default (tomorrow at 9am) if calculation failed
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    console.log('Using fallback date after error:', fallback.toISOString());
    return fallback;
  }
};

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
