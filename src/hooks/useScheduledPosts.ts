
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, useAuthRedirect } from '@/utils/supabaseUserUtils';
import { useScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { usePostScheduling } from './usePostScheduling';
import { format, isToday, isTomorrow, addDays, isBefore, isAfter } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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
}

type TimeframeGroup = 'today' | 'tomorrow' | 'thisWeek' | 'later';

export interface GroupedPosts {
  today: ScheduledPost[];
  tomorrow: ScheduledPost[];
  thisWeek: ScheduledPost[];
  later: ScheduledPost[];
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { redirectToLogin } = useAuthRedirect();
  const { userSettings, fetchUserSettings } = useScheduleSettings();
  const { postToLinkedIn } = usePostOperations();
  const { scheduleContentIdea } = usePostScheduling();

  const fetchPosts = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        redirectToLogin();
        return;
      }

      const now = new Date();
      console.log('Fetching scheduled posts after:', now.toISOString());

      // Get posts that are scheduled for the future
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
        .gt('next_run_at', now.toISOString()) // Only get future posts
        .order('next_run_at', { ascending: true });

      if (postsError) throw postsError;

      console.log('Fetched scheduled posts:', postsData);
      
      // Improved deduplication: Consider both date and content ID
      const uniquePosts = [];
      const seenContentIds = new Set();
      
      if (postsData) {
        for (const post of postsData) {
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
      }

      const postsArray = uniquePosts as ScheduledPost[];
      setPosts(postsArray);
      
      // Group posts by timeframe
      groupPostsByTimeframe(postsArray);
      
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
  
  const groupPostsByTimeframe = (posts: ScheduledPost[]) => {
    const today: ScheduledPost[] = [];
    const tomorrow: ScheduledPost[] = [];
    const thisWeek: ScheduledPost[] = [];
    const later: ScheduledPost[] = [];
    
    const now = new Date();
    const endOfWeek = addDays(now, 7);
    
    posts.forEach(post => {
      const postDate = new Date(post.next_run_at);
      
      if (isToday(postDate)) {
        today.push(post);
      } else if (isTomorrow(postDate)) {
        tomorrow.push(post);
      } else if (isBefore(postDate, endOfWeek)) {
        thisWeek.push(post);
      } else {
        later.push(post);
      }
    });
    
    setGroupedPosts({
      today,
      tomorrow,
      thisWeek,
      later
    });
  };

  // Format the schedule date with timezone consideration
  const formatScheduleDate = (dateString: string, timezone: string) => {
    try {
      const date = new Date(dateString);
      const userTimezone = timezone || 'UTC';
      
      // Use formatInTimeZone to ensure correct timezone display
      // Check if the date is today or tomorrow in the user's timezone
      const todayInUserTz = formatInTimeZone(new Date(), userTimezone, 'yyyy-MM-dd');
      const dateInUserTz = formatInTimeZone(date, userTimezone, 'yyyy-MM-dd');
      const tomorrowInUserTz = formatInTimeZone(new Date(new Date().setDate(new Date().getDate() + 1)), userTimezone, 'yyyy-MM-dd');
      
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

  useEffect(() => {
    const initialize = async () => {
      await fetchUserSettings();
      await fetchPosts();
    };
    
    initialize();
  }, []);

  return {
    posts,
    groupedPosts,
    loading,
    postToLinkedIn,
    fetchPosts,
    scheduleContentIdea,
    userSettings,
    formatScheduleDate,
    getSchedulePattern
  };
}
