
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
    
    // Start with current time or tomorrow if needed
    const now = new Date();
    let nextRun = new Date();
    
    // Set the time components
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today AND we're calculating for the first post (offset 0),
    // start from tomorrow
    if (nextRun <= now && daysOffset === 0) {
      nextRun.setDate(nextRun.getDate() + 1);
      console.log('Time already passed today for first post, scheduling for tomorrow:', nextRun.toISOString());
    } else if (daysOffset === 0) {
      // If time hasn't passed today and it's the first post, use today
      console.log('Using today for first post:', nextRun.toISOString());
    }
    
    console.log('Base next run time (before applying frequency and offset):', nextRun.toISOString());
    
    // Apply frequency specific adjustments with offset
    switch (settings.frequency) {
      case "daily":
        // For daily frequency, add the offset in days
        // This ensures each post is scheduled on consecutive days
        nextRun.setDate(nextRun.getDate() + daysOffset);
        console.log('Daily schedule with offset:', daysOffset, 'days, result:', nextRun.toISOString());
        break;

      case "weekly":
        if (settings.dayOfWeek !== undefined && settings.dayOfWeek >= 0 && settings.dayOfWeek <= 6) {
          // For the first post (offset 0), find the next occurrence of the target day
          if (daysOffset === 0) {
            const currentDay = nextRun.getDay();
            let daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
            
            // If we're already on the target day but the time has passed, schedule for next week
            if (daysUntilTarget === 0 && nextRun <= now) {
              daysUntilTarget = 7;
            }
            
            nextRun.setDate(nextRun.getDate() + daysUntilTarget);
          } else {
            // For subsequent posts, add weeks based on offset
            nextRun.setDate(nextRun.getDate() + (daysOffset * 7));
          }
          
          console.log('Weekly schedule - target day:', settings.dayOfWeek, 'offset:', daysOffset, 'result:', nextRun.toISOString());
        } else {
          console.warn('Invalid dayOfWeek, treating as daily schedule with weekly increment');
          nextRun.setDate(nextRun.getDate() + (daysOffset * 7));
        }
        break;

      case "monthly":
        if (settings.dayOfMonth !== undefined && settings.dayOfMonth >= 1 && settings.dayOfMonth <= 31) {
          // For the first post (offset 0), find the next occurrence of the target day
          if (daysOffset === 0) {
            const daysInCurrentMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            const targetDay = Math.min(settings.dayOfMonth, daysInCurrentMonth);
            nextRun.setDate(targetDay);
            
            // If this date is in the past or it's today but time has passed, move to next month
            if (nextRun <= now) {
              nextRun.setMonth(nextRun.getMonth() + 1);
              const daysInNextMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
              nextRun.setDate(Math.min(settings.dayOfMonth, daysInNextMonth));
            }
          } else {
            // For subsequent posts, add months based on offset
            nextRun.setMonth(nextRun.getMonth() + daysOffset);
            const daysInOffsetMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, daysInOffsetMonth));
          }
          
          console.log('Monthly schedule - target day:', settings.dayOfMonth, 'offset:', daysOffset, 'result:', nextRun.toISOString());
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
      fallback.setDate(fallback.getDate() + 1 + daysOffset);
      fallback.setHours(9, 0, 0, 0);
      console.log('Using fallback date:', fallback.toISOString());
      return fallback;
    }
    
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    // Return a safe default (tomorrow at 9am) if calculation failed
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1 + daysOffset);
    fallback.setHours(9, 0, 0, 0);
    console.log('Using fallback date after error:', fallback.toISOString());
    return fallback;
  }
};

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
