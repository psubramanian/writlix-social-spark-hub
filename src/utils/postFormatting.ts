
import { format, addDays, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const formatScheduleDate = (dateString: string, timezone: string) => {
  try {
    const date = parseISO(dateString);
    const userTimezone = timezone || 'UTC';
    
    console.log(`Formatting date ${dateString} in timezone ${userTimezone}`);
    
    // Debug the native Date object
    const nativeDate = new Date(dateString);
    console.log('Native JS date interpretation:', nativeDate.toString());
    console.log('Native JS date hours/minutes:', nativeDate.getHours(), ':', nativeDate.getMinutes());
    
    // Debug the date-fns-tz conversion
    const zonedDate = toZonedTime(date, userTimezone);
    console.log('Zoned date in', userTimezone, ':', zonedDate.toString());
    console.log('Zoned date hours/minutes:', zonedDate.getHours(), ':', zonedDate.getMinutes());
    
    // Use formatInTimeZone to ensure correct timezone display
    // Check if the date is today or tomorrow in the user's timezone
    const todayInUserTz = formatInTimeZone(new Date(), userTimezone, 'yyyy-MM-dd');
    const dateInUserTz = formatInTimeZone(date, userTimezone, 'yyyy-MM-dd');
    const tomorrowInUserTz = formatInTimeZone(addDays(new Date(), 1), userTimezone, 'yyyy-MM-dd');
    
    // Format with explicit AM/PM marker to ensure 12-hour clock is displayed correctly
    if (dateInUserTz === todayInUserTz) {
      return `Today at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
    }
    
    if (dateInUserTz === tomorrowInUserTz) {
      return `Tomorrow at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
    }
    
    return formatInTimeZone(date, userTimezone, "MMM d, yyyy 'at' h:mm a");
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Invalid date";
  }
};

export const getSchedulePattern = (settings: any) => {
  if (!settings) return 'No pattern set';
  
  const { frequency, dayOfWeek, dayOfMonth } = settings;
  
  switch (frequency) {
    case 'daily':
      return 'Repeats daily';
    case 'weekly':
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = dayOfWeek !== undefined ? days[dayOfWeek] : '(day not set)';
      return `Repeats weekly on ${day}`;
    case 'monthly':
      const dateOrdinal = dayOfMonth !== undefined ? getOrdinalSuffix(dayOfMonth) : '(date not set)';
      return `Repeats monthly on the ${dateOrdinal}`;
    default:
      return 'Custom schedule';
  }
};

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};
