
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Loader2, Eye } from "lucide-react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { ScheduledPost } from '@/hooks/useScheduledPosts';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

interface GroupedPosts {
  today: ScheduledPost[];
  tomorrow: ScheduledPost[];
  thisWeek: ScheduledPost[];
  later: ScheduledPost[];
  past: ScheduledPost[];
}

interface ScheduledPostsCalendarProps {
  posts: ScheduledPost[];
  groupedPosts: GroupedPosts;
  loading: boolean;
  postingId: string | null;
  onPostNow: (postId: string, platform: string, imageUrl?: string) => void;
  onOpenPostPreview: (post: ScheduledPost) => void;
  formatScheduleDate: (dateString: string, timezone: string) => string;
  userTimezone?: string;
}

export function ScheduledPostsCalendar({
  posts,
  loading,
  postingId,
  onPostNow,
  onOpenPostPreview,
  formatScheduleDate,
  userTimezone = 'UTC'
}: ScheduledPostsCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDatePosts, setSelectedDatePosts] = useState<ScheduledPost[]>([]);
  
  // Helper function to get posts for a specific date
  const getPostsForDate = (date: Date | undefined): ScheduledPost[] => {
    if (!date) return [];
    
    const targetDateStr = format(date, 'yyyy-MM-dd');
    
    return posts.filter(post => {
      try {
        if (!post.next_run_at) return false;
        
        const postTimezone = post.timezone || userTimezone;
        const postDate = parseISO(post.next_run_at);
        
        // Format the post date in the post's timezone
        const postDateStr = formatInTimeZone(postDate, postTimezone, 'yyyy-MM-dd');
        return postDateStr === targetDateStr;
      } catch (error) {
        console.error("Error filtering posts by date:", error);
        return false;
      }
    });
  };
  
  // Helper function to format time in the proper timezone
  const formatTimeInTimezone = (dateString: string, timezone: string) => {
    try {
      const date = parseISO(dateString);
      return formatInTimeZone(date, timezone, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Update selected posts when date changes
  React.useEffect(() => {
    if (date) {
      const postsForDate = getPostsForDate(date);
      setSelectedDatePosts(postsForDate);
    }
  }, [date, posts]);

  // Function to render posts for the selected date
  const renderPostsList = () => {
    if (selectedDatePosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No posts scheduled</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            There are no posts scheduled for {date ? format(date, 'MMMM d, yyyy') : 'this day'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 mt-4">
        {selectedDatePosts.map(post => (
          <div key={post.id} className="border rounded-md p-4 bg-white dark:bg-slate-900">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{post.content_ideas?.title || "Untitled Post"}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6" 
                    onClick={() => onOpenPostPreview(post)}
                    title="Preview post"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="outline">
                  {post.content_ideas?.status || "Pending"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTimeInTimezone(post.next_run_at, post.timezone || userTimezone)} 
                  {post.timezone !== 'UTC' ? ` (${post.timezone})` : ''}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground mr-2">Post now:</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1"
                  onClick={() => onPostNow(post.id, 'linkedin')}
                  disabled={postingId === post.id}
                >
                  {postingId === post.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Linkedin className="h-3 w-3 mr-1" />
                  )}
                  <span>LinkedIn</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1"
                  onClick={() => onPostNow(post.id, 'facebook')}
                  disabled={postingId === post.id}
                >
                  {postingId === post.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Facebook className="h-3 w-3 mr-1" />
                  )}
                  <span>Facebook</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1"
                  onClick={() => onPostNow(post.id, 'instagram')}
                  disabled={postingId === post.id}
                >
                  {postingId === post.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Instagram className="h-3 w-3 mr-1" />
                  )}
                  <span>Instagram</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Generate calendar day contents with post indicators
  const generatePostHighlightDays = (date: Date): React.ReactNode => {
    const postsForDay = getPostsForDate(date);
    
    if (postsForDay.length > 0) {
      return (
        <div className="relative h-full w-full">
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
            {postsForDay.length}
          </Badge>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>View your scheduled posts by date</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
        <CardDescription>
          View your scheduled posts by date 
          {userTimezone !== 'UTC' ? ` (${userTimezone})` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="border rounded-md p-4"
              components={{
                DayContent: (props) => (
                  <>
                    {props.date.getDate()}
                    {generatePostHighlightDays(props.date)}
                  </>
                )
              }}
            />
          </div>
          
          <div>
            <div className="rounded-md border p-4 h-full">
              <h3 className="text-lg font-semibold">
                {date && format(date, 'MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {selectedDatePosts.length === 0 ? 'No posts scheduled' : 
                  `${selectedDatePosts.length} post${selectedDatePosts.length !== 1 ? 's' : ''} scheduled`}
              </p>
              <Separator />
              {renderPostsList()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
