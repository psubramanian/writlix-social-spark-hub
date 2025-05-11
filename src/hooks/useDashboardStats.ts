
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

      // Count scheduled posts (only future ones)
      const { count: scheduledCount, error: scheduledError } = await supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gt('next_run_at', now.toISOString()); // Only count future posts

      // Count published posts for the current month
      const { count: publishedCount, error: publishedError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Published')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // Count posts to review
      const { count: reviewCount, error: reviewError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Review')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (createdError || scheduledError || publishedError || reviewError) {
        throw new Error('Error fetching dashboard stats');
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
