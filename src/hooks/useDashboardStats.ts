import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

interface DashboardStats {
  postsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  postsToReview: number;
}

export function useDashboardStats(selectedMonth: Date) {
  const [stats, setStats] = useState<DashboardStats>({
    postsCreated: 0,
    postsScheduled: 0,
    postsPublished: 0,
    postsToReview: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const now = new Date();
      console.log('Dashboard stats - now:', now.toISOString());

      // Count all content ideas for the current month (includes both created and imported)
      const { count: totalContentCount, error: createdError } = await supabase
        .from('content_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (createdError) {
        console.error('Error fetching created content count:', createdError);
        throw createdError;
      }

      // Count scheduled posts by joining with content_ideas to ensure both conditions are met
      const { data: scheduledPostsData, error: scheduledPostsError } = await supabase
        .from('scheduled_posts')
        .select(`
          content_id,
          content_ideas!inner(status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('content_ideas.status', 'Scheduled')
        .gt('next_run_at', now.toISOString());

      if (scheduledPostsError) {
        console.error('Error fetching scheduled posts:', scheduledPostsError);
        throw scheduledPostsError;
      }
      
      // Deduplicate by content_id to get accurate count
      const uniqueContentIds = new Set();
      
      if (scheduledPostsData && Array.isArray(scheduledPostsData)) {
        scheduledPostsData.forEach(post => {
          // Type guard to ensure we have the right structure
          if (post && typeof post === 'object' && 'content_id' in post && post.content_id) {
            uniqueContentIds.add(post.content_id);
          }
        });
      }
      
      const scheduledCount = uniqueContentIds.size;
      console.log('Scheduled posts count (deduplicated):', scheduledCount);

      // Count published posts for the current month
      const { count: publishedCount, error: publishedError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Published')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (publishedError) {
        console.error('Error fetching published count:', publishedError);
        throw publishedError;
      }

      // Count posts to review
      const { count: reviewCount, error: reviewError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Review')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (reviewError) {
        console.error('Error fetching review count:', reviewError);
        throw reviewError;
      }

      console.log('Dashboard stats:', {
        created: totalContentCount,
        scheduled: scheduledCount,
        published: publishedCount,
        review: reviewCount
      });

      setStats({
        postsCreated: totalContentCount || 0,
        postsScheduled: scheduledCount || 0,
        postsPublished: publishedCount || 0,
        postsToReview: reviewCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error loading dashboard stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  return { stats, loading, refetch: fetchStats };
}
