
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2, Eye } from "lucide-react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { ScheduledPost } from '@/hooks/useScheduledPosts';
import { formatInTimeZone } from 'date-fns-tz';
import { isToday, isTomorrow, parseISO } from 'date-fns';

interface GroupedPosts {
  today: ScheduledPost[];
  tomorrow: ScheduledPost[];
  thisWeek: ScheduledPost[];
  later: ScheduledPost[];
  past: ScheduledPost[];
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  groupedPosts: GroupedPosts;
  loading: boolean;
  postingId: string | null;
  onPostNow: (postId: string, platform: string, imageUrl?: string) => void;
  onOpenPostPreview: (post: ScheduledPost) => void;
  formatScheduleDate: (dateString: string, timezone: string) => string;
  schedulePattern?: string;
  userTimezone?: string;
}

export function ScheduledPostsList({
  posts,
  groupedPosts,
  loading,
  postingId,
  onPostNow,
  onOpenPostPreview,
  formatScheduleDate,
  schedulePattern,
  userTimezone = 'UTC'
}: ScheduledPostsListProps) {
  console.log('Rendering scheduled posts with timezone:', userTimezone);
  console.log('Grouped posts:', groupedPosts);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
          <CardDescription>Your upcoming post schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[100px] w-full rounded-md" />
          <Skeleton className="h-[100px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  // Helper function to show time in proper timezone format
  const formatTimeInTimezone = (dateString: string, timezone: string) => {
    try {
      const date = parseISO(dateString);
      // Use the correct format string to ensure we're displaying AM/PM properly
      return formatInTimeZone(date, timezone, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const renderPostGroup = (title: string, groupPosts: ScheduledPost[]) => {
    if (groupPosts.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="space-y-4">
          {groupPosts.map(post => renderPost(post))}
        </div>
      </div>
    );
  };
  
  const renderPost = (post: ScheduledPost) => {
    // Use the post's timezone if available, otherwise fall back to user timezone
    const postTimezone = post.timezone || userTimezone || 'UTC';
    // Determine if post date is in the past
    const postDate = parseISO(post.next_run_at);
    const now = new Date();
    const isPastDate = postDate < now && !isToday(postDate);
    
    // Debug logging to identify time conversion issues
    console.log(`Post ${post.id} scheduled for:`, post.next_run_at);
    console.log(`Using timezone:`, postTimezone);
    console.log(`Formatted time:`, formatTimeInTimezone(post.next_run_at, postTimezone));
    
    return (
      <div key={post.id} className={`border rounded-md p-4 ${isPastDate ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-900'}`}>
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
            <div className="flex gap-2">
              {isPastDate && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  Past Due
                </Badge>
              )}
              <Badge variant="outline" className="ml-2">
                {post.content_ideas?.status || "Pending"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className={`font-medium ${isPastDate ? 'text-amber-600' : ''}`}>
              {formatScheduleDate(post.next_run_at, postTimezone)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {isPastDate ? "Was scheduled for " : "Scheduled for "} 
              {formatTimeInTimezone(post.next_run_at, postTimezone)} 
              {postTimezone !== 'UTC' ? ` (${postTimezone})` : ''}
            </span>
          </div>
          
          {schedulePattern && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{schedulePattern}</span>
            </div>
          )}
          
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
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Posts</CardTitle>
        <CardDescription>Your upcoming post schedule</CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No scheduled posts</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              You haven't scheduled any posts yet. Go to the Content page and schedule some of your content ideas.
            </p>
          </div>
        ) : (
          <div>
            {/* Show past posts first with warning styling */}
            {renderPostGroup("Past Due", groupedPosts.past)}
            {renderPostGroup("Today", groupedPosts.today)}
            {renderPostGroup("Tomorrow", groupedPosts.tomorrow)}
            {renderPostGroup("This Week", groupedPosts.thisWeek)}
            {renderPostGroup("Later", groupedPosts.later)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
