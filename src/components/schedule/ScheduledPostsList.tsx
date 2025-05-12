
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { AlertCircle, Loader2, Calendar, Clock } from "lucide-react";
import { Facebook, Instagram, Linkedin } from "lucide-react";

interface ScheduledPost {
  id: string;
  content_ideas?: {
    title: string;
    status: string;
  };
  next_run_at: string;
  timezone: string;
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  loading: boolean;
  postingId: string | null;
  onPostNow: (postId: string, platform: string, imageUrl?: string) => void;
}

export function ScheduledPostsList({
  posts,
  loading,
  postingId,
  onPostNow
}: ScheduledPostsListProps) {
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
        return `Today at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
      }
      
      if (dateInUserTz === tomorrowInUserTz) {
        return `Tomorrow at ${formatInTimeZone(date, userTimezone, 'h:mm a')}`;
      }
      
      return formatInTimeZone(date, userTimezone, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };

  console.log('Rendering scheduled posts:', posts);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Posts</CardTitle>
        <CardDescription>Your upcoming post schedule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No scheduled posts</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              You haven't scheduled any posts yet. Go to the Content page and schedule some of your content ideas.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="border rounded-md p-4">
              <div className="flex flex-col space-y-3">
                <div>
                  <h3 className="font-medium text-sm">{post.content_ideas?.title || "Untitled Post"}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatScheduleDate(post.next_run_at, post.timezone || 'UTC')}</span>
                    <span className="ml-1">({post.timezone || 'UTC'})</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
