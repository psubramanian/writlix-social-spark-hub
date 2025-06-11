
import { useState } from 'react';
import { addDays, isBefore, isToday, isTomorrow, parseISO, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { ScheduledPost } from './useScheduledPosts';

export interface GroupedPosts {
  today: ScheduledPost[];
  tomorrow: ScheduledPost[];
  thisWeek: ScheduledPost[];
  later: ScheduledPost[];
  past: ScheduledPost[];
}

export function usePostGrouping() {
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    past: []
  });

  const groupPostsByTimeframe = (posts: ScheduledPost[], defaultTimezone: string) => {
    const today: ScheduledPost[] = [];
    const tomorrow: ScheduledPost[] = [];
    const thisWeek: ScheduledPost[] = [];
    const later: ScheduledPost[] = [];
    const past: ScheduledPost[] = [];
    
    const now = new Date();
    const endOfWeek = addDays(now, 7);
    
    posts.forEach(post => {
      // Use the post's timezone if available, otherwise fall back to user timezone
      const timezone = post.timezone || defaultTimezone || 'UTC';
      // Parse date and convert to the appropriate timezone
      const postDate = toZonedTime(parseISO(post.next_run_at), timezone);
      const nowInTimezone = toZonedTime(now, timezone);
      const endOfWeekInTimezone = toZonedTime(endOfWeek, timezone);
      
      // Check if this is a past post (considering timezone)
      if (isBefore(postDate, nowInTimezone) && !isToday(postDate)) {
        past.push(post);
      } else if (isToday(postDate)) {
        today.push(post);
      } else if (isTomorrow(postDate)) {
        tomorrow.push(post);
      } else if (isBefore(postDate, endOfWeekInTimezone)) {
        thisWeek.push(post);
      } else {
        later.push(post);
      }
    });
    
    console.log('Grouped posts by timeframe with timezone consideration:', {
      today: today.length,
      tomorrow: tomorrow.length, 
      thisWeek: thisWeek.length,
      later: later.length,
      past: past.length
    });
    
    setGroupedPosts({
      today,
      tomorrow,
      thisWeek,
      later,
      past
    });
  };

  const getPostsForDate = (date: Date, posts: ScheduledPost[], userTimezone: string): ScheduledPost[] => {
    if (!date) return [];
    
    // Convert to start of day in user's timezone
    const targetDate = toZonedTime(date, userTimezone || 'UTC');
    
    console.log('Getting posts for date:', date.toString());
    console.log('Target date in timezone:', targetDate.toString());
    
    return posts.filter(post => {
      try {
        if (!post.next_run_at) return false;
        
        const postDate = parseISO(post.next_run_at);
        const postDateInTz = toZonedTime(postDate, post.timezone || userTimezone || 'UTC');
        
        console.log('Post date:', postDateInTz.toString());
        console.log('Is same day?', isSameDay(targetDate, postDateInTz));
        
        return isSameDay(targetDate, postDateInTz);
      } catch (error) {
        console.error("Error filtering posts by date:", error);
        return false;
      }
    });
  };

  return {
    groupedPosts,
    groupPostsByTimeframe,
    getPostsForDate
  };
}
