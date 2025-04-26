
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth } from 'date-fns';

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
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      if (!user) return;

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const { data: createdPosts, error: createdError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // Count currently scheduled posts (not filtered by month of creation)
      const { data: scheduledPosts, error: scheduledError } = await supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const { data: publishedPosts, error: publishedError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'Published')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const { data: reviewPosts, error: reviewError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'Review')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (createdError || scheduledError || publishedError || reviewError) {
        throw new Error('Error fetching dashboard stats');
      }

      setStats({
        postsCreated: createdPosts?.length || 0,
        postsScheduled: scheduledPosts?.length || 0,
        postsPublished: publishedPosts?.length || 0,
        postsToReview: reviewPosts?.length || 0
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
  }, [user, selectedMonth]);

  return { stats, loading, refetch: fetchStats };
}
