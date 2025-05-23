
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
import { useScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { usePostScheduling } from './usePostScheduling';
import { format, isToday, isTomorrow, addDays, isBefore, isAfter, parseISO, isSameDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export interface ScheduledPost {
  id: string;
  content_ideas: {
    id: number;
    title: string;
    content: string;
    status: string;
  };
  next_run_at: string;
  timezone: string;
  user_id: string;
  status: string;
}

type TimeframeGroup = 'today' | 'tomorrow' | 'thisWeek' | 'later';

export interface GroupedPosts {
  today: ScheduledPost[];
  tomorrow: ScheduledPost[];
  thisWeek: ScheduledPost[];
  later: ScheduledPost[];
  past: ScheduledPost[];
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    past: [] // Initialize past posts array
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();
  const { userSettings, fetchUserSettings } = useScheduleSettings();
  const { savePostContent, regenerateContent, isRegenerating, postToLinkedIn, postToFacebook, postToInstagram } = usePostOperations();
  const { scheduleContentIdea } = usePostScheduling();

  const fetchPosts = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return;
      }

      console.log('Fetching all scheduled posts');

      // Only get pending posts, not published ones
      const { data: postsData, error: postsError } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          content_ideas (
            id,
            title,
            content,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('next_run_at', { ascending: true });

      if (postsError) throw postsError;

      console.log('Fetched scheduled posts:', postsData);
      
      // Further filter out any posts where content status is Published
      const filteredPosts = postsData ? postsData.filter(post => 
        post.content_ideas && post.content_ideas.status !== 'Published'
      ) : [];
      
      console.log('After filtering published content:', filteredPosts);
      
      // Improved deduplication: Consider both date and content ID
      const uniquePosts = [];
      const seenContentIds = new Set();
      
      for (const post of filteredPosts) {
        const contentId = post.content_ideas?.id;
        
        // Skip this post if we've already seen this content ID
        if (contentId && seenContentIds.has(contentId)) {
          console.log(`Skipping duplicate post for content ID: ${contentId}`);
          continue;
        }
        
        // Add this content ID to our tracking set if it exists
        if (contentId) {
          seenContentIds.add(contentId);
        }
        
        uniquePosts.push(post);
      }

      const postsArray = uniquePosts as ScheduledPost[];
      setPosts(postsArray);
      
      // Group posts by timeframe
      groupPostsByTimeframe(postsArray, userSettings?.timezone || 'UTC');
      
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Failed to load posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const groupPostsByTimeframe = (posts: ScheduledPost[], defaultTimezone: string) => {
    const today: ScheduledPost[] = [];
    const tomorrow: ScheduledPost[] = [];
    const thisWeek: ScheduledPost[] = [];
    const later: ScheduledPost[] = [];
    const past: ScheduledPost[] = []; // Added past posts array
    
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

  // Format the schedule date with timezone consideration
  const formatScheduleDate = (dateString: string, timezone: string) => {
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
  
  // Get schedule pattern description based on user settings
  const getSchedulePattern = (settings: any) => {
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
  
  // Helper to get ordinal suffix for dates (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  };

  // Get posts for a specific date (new function for calendar view)
  const getPostsForDate = (date: Date): ScheduledPost[] => {
    if (!date) return [];
    
    // Convert to start of day in user's timezone
    const targetDate = toZonedTime(date, userSettings?.timezone || 'UTC');
    
    console.log('Getting posts for date:', format(date, 'yyyy-MM-dd'));
    console.log('Target date in timezone:', format(targetDate, 'yyyy-MM-dd'));
    
    return posts.filter(post => {
      try {
        if (!post.next_run_at) return false;
        
        const postDate = parseISO(post.next_run_at);
        const postDateInTz = toZonedTime(postDate, post.timezone || userSettings?.timezone || 'UTC');
        
        console.log('Post date:', format(postDateInTz, 'yyyy-MM-dd'));
        console.log('Is same day?', isSameDay(targetDate, postDateInTz));
        
        return isSameDay(targetDate, postDateInTz);
      } catch (error) {
        console.error("Error filtering posts by date:", error);
        return false;
      }
    });
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchUserSettings();
      await fetchPosts();
    };
    
    initialize();
  }, []);

  // Re-group posts whenever userSettings timezone changes
  useEffect(() => {
    if (posts.length > 0 && userSettings?.timezone) {
      groupPostsByTimeframe(posts, userSettings.timezone);
    }
  }, [userSettings?.timezone, posts]);

  return {
    posts,
    groupedPosts,
    loading,
    savePostContent,
    regenerateContent,
    isRegenerating,
    postToLinkedIn,
    postToFacebook,
    postToInstagram,
    fetchPosts,
    scheduleContentIdea,
    userSettings,
    formatScheduleDate,
    getSchedulePattern,
    getPostsForDate
  };
}
