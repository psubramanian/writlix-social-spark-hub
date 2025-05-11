
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { format, isToday, isTomorrow } from 'date-fns';

interface UpcomingPostsProps {
  scheduledPostsCount: number;
}

interface UpcomingPost {
  id: string;
  title: string;
  nextRunAt: string;
  timezone: string;
}

export function UpcomingPosts({ scheduledPostsCount }: UpcomingPostsProps) {
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingPosts = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const now = new Date();
        
        // Get posts that are scheduled for the future
        const { data, error } = await supabase
          .from('scheduled_posts')
          .select(`
            id,
            next_run_at,
            timezone,
            content_ideas (
              title
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gt('next_run_at', now.toISOString()) // Only get future posts
          .order('next_run_at', { ascending: true })
          .limit(2);

        if (error) {
          console.error('Error fetching upcoming posts:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const formattedPosts = data.map((post) => ({
            id: post.id,
            title: post.content_ideas?.title || 'Untitled Post',
            nextRunAt: post.next_run_at,
            timezone: post.timezone || 'UTC'
          }));
          
          console.log('Formatted upcoming posts:', formattedPosts);
          setUpcomingPosts(formattedPosts);
        } else {
          console.log('No upcoming posts found');
          setUpcomingPosts([]);
        }
      } catch (error) {
        console.error('Error fetching upcoming posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingPosts();
  }, []);

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if the date is today
    if (isToday(date)) {
      return `today at ${format(date, 'h:mm a')}`;
    }
    
    // Check if the date is tomorrow
    if (isTomorrow(date)) {
      return `tomorrow at ${format(date, 'h:mm a')}`;
    }
    
    return `${format(date, 'MMM d')} at ${format(date, 'h:mm a')}`;
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Upcoming Posts</CardTitle>
        <CardDescription>Posts scheduled to be published soon</CardDescription>
      </CardHeader>
      <CardContent>
        {scheduledPostsCount > 0 ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading upcoming posts...</div>
            ) : upcomingPosts.length > 0 ? (
              <>
                {upcomingPosts.map(post => (
                  <div key={post.id} className="border rounded-md p-4">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scheduled for {formatScheduleDate(post.nextRunAt)}
                    </p>
                  </div>
                ))}
                <Link to="/schedule">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View All Scheduled Posts ({scheduledPostsCount})
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">No upcoming posts found</p>
                <Link to="/schedule">
                  <Button variant="outline" size="sm">View Schedule</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No posts scheduled yet</p>
            <Link to="/data-seed">
              <Button variant="default">Create Content</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
