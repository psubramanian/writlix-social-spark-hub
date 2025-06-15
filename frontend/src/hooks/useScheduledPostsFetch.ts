
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { ScheduledPost } from './useScheduledPosts';

export function useScheduledPostsFetch(userId: string | undefined) {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view scheduled posts.",
          variant: "destructive",
        });
        return [];
      }

      console.log('Fetching all scheduled posts from LocalStack API');

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/scheduled-posts?userId=${userId}&status=pending`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch scheduled posts' }));
        throw new Error(errorData.message || 'Failed to fetch scheduled posts');
      }

      const postsData = await response.json();
      console.log('Fetched scheduled posts from API:', postsData);

      // Transform DynamoDB data structure to match frontend expectations
      const transformedPosts = postsData.map((post: any) => ({
        id: post.SK || post.id,
        content_ideas: {
          id: post.contentId || 1,
          title: post.title || 'Generated Content',
          content: post.content || '',
          status: post.status === 'pending' ? 'Scheduled' : post.status
        },
        next_run_at: post.scheduledAt || post.nextRunAt,
        timezone: post.timezone || 'UTC',
        user_id: post.userId || userId,
        status: post.status || 'pending'
      }));

      // Sort by scheduled time
      transformedPosts.sort((a: any, b: any) => new Date(a.next_run_at).getTime() - new Date(b.next_run_at).getTime());

      console.log('Transformed scheduled posts:', transformedPosts);
      
      const postsArray = transformedPosts as ScheduledPost[];
      setPosts(postsArray);
      
      return postsArray;
      
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Failed to load posts",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    fetchPosts,
    setPosts
  };
}
