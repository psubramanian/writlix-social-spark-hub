
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import type { ScheduledPost, GroupedPosts } from '@/hooks/useScheduledPosts';

interface ScheduledPostsCalendarProps {
  posts: ScheduledPost[];
  groupedPosts: GroupedPosts;
  loading: boolean;
  postingId: string | null;
  onPostNow: (postId: string, platform: string, imageUrl?: string) => void;
  formatScheduleDate: (dateString: string, timezone: string) => string;
  userTimezone?: string;
}

export function ScheduledPostsCalendar({
  posts,
  groupedPosts,
  loading,
  postingId,
  onPostNow,
  formatScheduleDate,
  userTimezone = 'UTC'
}: ScheduledPostsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
          <CardDescription>Your calendar view</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  // Function to get posts scheduled for a specific date
  const getPostsForDate = (date: Date): ScheduledPost[] => {
    return posts.filter(post => {
      try {
        const postDate = parseISO(post.next_run_at);
        // Convert to user timezone for accurate comparison
        const postDateInUserTz = toZonedTime(postDate, post.timezone || userTimezone);
        const dateInUserTz = toZonedTime(date, userTimezone);
        return isSameDay(postDateInUserTz, dateInUserTz);
      } catch (error) {
        console.error("Error comparing dates:", error);
        return false;
      }
    });
  };

  // Custom day renderer to show post indicators
  const renderDay = (day: Date) => {
    const postsOnDay = getPostsForDate(day);
    const hasPostsToday = postsOnDay.length > 0;
    
    return (
      <div className="relative flex h-9 w-9 items-center justify-center p-0">
        <div className="absolute h-9 w-9 flex items-center justify-center">
          {day.getDate()}
        </div>
        {hasPostsToday && (
          <div className="absolute bottom-1 w-full flex justify-center">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
          </div>
        )}
      </div>
    );
  };
  
  // Get posts for the selected date to display in the details section
  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];
  
  // Format time in the proper timezone
  const formatTimeInTimezone = (dateString: string, timezone: string) => {
    try {
      const date = parseISO(dateString);
      return formatInTimeZone(date, timezone, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Posts</CardTitle>
        <CardDescription>Your calendar view</CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              You haven't scheduled any posts yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onMonthChange={setMonth}
              month={month}
              className="border rounded-md p-3 w-full pointer-events-auto"
              classNames={{
                day_today: "bg-muted text-muted-foreground font-normal",
                day_selected: "bg-primary text-primary-foreground font-bold",
              }}
              components={{
                Day: renderDay
              }}
            />
            
            {selectedDate && (
              <div>
                <h3 className="font-medium mb-2">
                  Posts on {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                
                {selectedDatePosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No posts scheduled for this date.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDatePosts.map(post => {
                      // Use the post's timezone if available, otherwise fall back to user timezone
                      const postTimezone = post.timezone || userTimezone || 'UTC';
                      const postDate = parseISO(post.next_run_at);
                      const now = new Date();
                      const isPastDate = postDate < now;
                      
                      return (
                        <div key={post.id} className={`border rounded-md p-4 ${isPastDate ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-900'}`}>
                          <div className="flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{post.content_ideas?.title || "Untitled Post"}</h3>
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
                            
                            <div className="text-sm text-muted-foreground">
                              {isPastDate ? "Was scheduled for " : "Scheduled for "} 
                              {formatTimeInTimezone(post.next_run_at, postTimezone)} 
                              {postTimezone !== 'UTC' ? ` (${postTimezone})` : ''}
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
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
