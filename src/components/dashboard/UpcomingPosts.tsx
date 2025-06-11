
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';

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
  const [pastDuePosts, setPastDuePosts] = useState<UpcomingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  useEffect(() => {
    const fetchUserTimezone = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return 'UTC';

        const { data, error } = await supabase
          .from('schedule_settings')
          .select('timezone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user timezone:', error);
          return 'UTC';
        }

        return data?.timezone || 'UTC';
      } catch (error) {
        console.error('Error in fetchUserTimezone:', error);
        return 'UTC';
      }
    };

    const fetchAllPosts = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const timezone = await fetchUserTimezone();
        setUserTimezone(timezone);
        console.log('User timezone for dashboard posts:', timezone);

        console.log('Fetching all scheduled posts for dashboard');
        
        // Get posts with proper join to ensure content_ideas status is 'Scheduled'
        const { data, error } = await supabase
          .from('scheduled_posts')
          .select(`
            id,
            next_run_at,
            timezone,
            content_ideas!inner(
              title,
              id,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .eq('content_ideas.status', 'Scheduled')
          .order('next_run_at', { ascending: true });

        if (error) {
          console.error('Error fetching scheduled posts:', error);
          throw error;
        }

        if (data && data.length > 0) {
          // Improved deduplication by content ID
          const uniquePosts = [];
          const seenContentIds = new Set();
          const now = new Date();
          const pastDue = [];
          const upcoming = [];
          
          for (const post of data) {
            // Safely access the data without complex type casting
            const postId = post.id;
            const nextRunAt = post.next_run_at;
            const postTimezone = post.timezone || timezone;
            
            // Handle content_ideas safely
            const contentIdeas = post.content_ideas;
            const contentTitle = Array.isArray(contentIdeas) 
              ? contentIdeas[0]?.title 
              : contentIdeas?.title;
            const contentId = Array.isArray(contentIdeas) 
              ? contentIdeas[0]?.id 
              : contentIdeas?.id;
            
            // Skip if we already have this content ID
            if (contentId && seenContentIds.has(contentId)) {
              console.log(`Skipping duplicate dashboard post for content ID: ${contentId}`);
              continue;
            }
            
            // Add to tracking set if it exists
            if (contentId) {
              seenContentIds.add(contentId);
            }
            
            const formattedPost = {
              id: postId,
              title: contentTitle || 'Untitled Post',
              nextRunAt: nextRunAt,
              timezone: postTimezone
            };
            
            // Sort into past due or upcoming
            const postDate = toZonedTime(parseISO(nextRunAt), postTimezone);
            const nowInTimezone = toZonedTime(now, postTimezone);
            
            if (postDate < nowInTimezone) {
              pastDue.push(formattedPost);
            } else {
              upcoming.push(formattedPost);
            }
          }
          
          console.log('Formatted upcoming posts:', upcoming);
          console.log('Formatted past due posts:', pastDue);
          
          setUpcomingPosts(upcoming.slice(0, 3));
          setPastDuePosts(pastDue.slice(0, 2));
        } else {
          console.log('No posts found');
          setUpcomingPosts([]);
          setPastDuePosts([]);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []);

  const formatScheduleDate = (dateString: string, timezone: string) => {
    try {
      const date = parseISO(dateString);
      const postTimezone = timezone || userTimezone || 'UTC';
      const now = new Date();
      
      const dateInTz = toZonedTime(date, postTimezone);
      const nowInTz = toZonedTime(now, postTimezone);
      
      console.log('Dashboard post date:', dateString);
      console.log('Using timezone:', postTimezone);
      console.log('Converted date (zoned):', dateInTz.toString());
      console.log('Current time (zoned):', nowInTz.toString());
      
      const isPast = dateInTz < nowInTz;
      const formattedDate = formatInTimeZone(date, postTimezone, 'MMM d at h:mm a');
      
      return isPast ? `was scheduled for ${formattedDate}` : `scheduled for ${formattedDate}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };

  const renderPost = (post: UpcomingPost, isPast = false) => {
    return (
      <div key={post.id} className={`border rounded-md p-4 ${isPast ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
        <div className="flex justify-between items-start">
          <p className="font-medium">{post.title}</p>
          {isPast && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              Past Due
            </Badge>
          )}
        </div>
        <p className={`text-sm mt-1 ${isPast ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {formatScheduleDate(post.nextRunAt, post.timezone)}
        </p>
      </div>
    );
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Scheduled Posts</CardTitle>
        <CardDescription>Your upcoming and past-due posts</CardDescription>
      </CardHeader>
      <CardContent>
        {scheduledPostsCount > 0 ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading posts...</div>
            ) : (
              <>
                {pastDuePosts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-amber-600 mb-2">Past Due</h3>
                    <div className="space-y-3 mb-4">
                      {pastDuePosts.map(post => renderPost(post, true))}
                    </div>
                  </div>
                )}
                
                {upcomingPosts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h3>
                    <div className="space-y-3">
                      {upcomingPosts.map(post => renderPost(post))}
                    </div>
                  </div>
                )}
                
                <Link to="/schedule">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View All Posts ({scheduledPostsCount})
                  </Button>
                </Link>
              </>
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
