
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DashboardStats {
  postsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  engagement: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    postsCreated: 0,
    postsScheduled: 0,
    postsPublished: 0,
    engagement: '0%'
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      if (!user) return;

      const { data: createdPosts, error: createdError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      const { data: scheduledPosts, error: scheduledError } = await supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const { data: publishedPosts, error: publishedError } = await supabase
        .from('content_ideas')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'Published');

      if (createdError || scheduledError || publishedError) {
        throw new Error('Error fetching dashboard stats');
      }

      setStats({
        postsCreated: createdPosts?.length || 0,
        postsScheduled: scheduledPosts?.length || 0,
        postsPublished: publishedPosts?.length || 0,
        engagement: '24%' // Note: Keeping this static since we don't track engagement yet
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
  }, [user]);

  return { stats, loading, refetch: fetchStats };
}
