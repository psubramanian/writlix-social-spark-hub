
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { format, isToday, isTomorrow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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
        console.log('Fetching upcoming posts after:', now.toISOString());
        
        // Get posts that are scheduled for the future
        // Increased limit to 5 instead of 2 to show more posts
        const { data, error } = await supabase
          .from('scheduled_posts')
          .select(`
            id,
            next_run_at,
            timezone,
            content_ideas (
              title,
              id
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gt('next_run_at', now.toISOString()) // Only get future posts
          .order('next_run_at', { ascending: true })
          .limit(5); // Show up to 5 posts instead of just 2

        if (error) {
          console.error('Error fetching upcoming posts:', error);
          throw error;
        }

        if (data && data.length > 0) {
          // Improved deduplication by content ID
          const uniquePosts = [];
          const seenContentIds = new Set();
          
          for (const post of data) {
            const contentId = post.content_ideas?.id;
            
            // Skip if we already have this content ID
            if (contentId && seenContentIds.has(contentId)) {
              console.log(`Skipping duplicate dashboard post for content ID: ${contentId}`);
              continue;
            }
            
            // Add to tracking set if it exists
            if (contentId) {
              seenContentIds.add(contentId);
            }
            
            uniquePosts.push({
              id: post.id,
              title: post.content_ideas?.title || 'Untitled Post',
              nextRunAt: post.next_run_at,
              timezone: post.timezone || 'UTC'
            });
          }
          
          console.log('Formatted upcoming posts:', uniquePosts);
          setUpcomingPosts(uniquePosts);
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
        return `today at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
      }
      
      if (dateInUserTz === tomorrowInUserTz) {
        return `tomorrow at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
      }
      
      return `${formatInTimeZone(date, userTimezone, 'MMM d')} at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
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
                      Scheduled for {formatScheduleDate(post.nextRunAt, post.timezone)}
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
