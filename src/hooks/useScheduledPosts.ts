
import { useEffect } from 'react';
import { useScheduleSettings } from './useScheduleSettings';
import { usePostOperations } from './usePostOperations';
import { usePostScheduling } from './usePostScheduling';
import { useScheduledPostsFetch } from './useScheduledPostsFetch';
import { usePostGrouping } from './usePostGrouping';
import { formatScheduleDate, getSchedulePattern } from '@/utils/postFormatting';

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

export function useScheduledPosts() {
  const { userSettings, fetchUserSettings } = useScheduleSettings();
  const { savePostContent, regenerateContent, isRegenerating, postToLinkedIn, postToFacebook, postToInstagram } = usePostOperations();
  const { scheduleContentIdea } = usePostScheduling();
  const { posts, loading, fetchPosts, setPosts } = useScheduledPostsFetch();
  const { groupedPosts, groupPostsByTimeframe, getPostsForDate } = usePostGrouping();

  // Group posts whenever posts or timezone changes
  useEffect(() => {
    if (posts.length > 0) {
      groupPostsByTimeframe(posts, userSettings?.timezone || 'UTC');
    }
  }, [posts, userSettings?.timezone]);

  useEffect(() => {
    const initialize = async () => {
      await fetchUserSettings();
      const fetchedPosts = await fetchPosts();
      if (fetchedPosts && fetchedPosts.length > 0) {
        groupPostsByTimeframe(fetchedPosts, userSettings?.timezone || 'UTC');
      }
    };
    
    initialize();
  }, []);

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
    fetchPosts: async () => {
      const fetchedPosts = await fetchPosts();
      if (fetchedPosts && fetchedPosts.length > 0) {
        groupPostsByTimeframe(fetchedPosts, userSettings?.timezone || 'UTC');
      }
    },
    scheduleContentIdea,
    userSettings,
    formatScheduleDate: (dateString: string, timezone: string) => formatScheduleDate(dateString, timezone),
    getSchedulePattern: (settings: any) => getSchedulePattern(settings),
    getPostsForDate: (date: Date) => getPostsForDate(date, posts, userSettings?.timezone || 'UTC')
  };
}
