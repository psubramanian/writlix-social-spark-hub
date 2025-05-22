
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScheduledPost, GroupedPosts } from '@/hooks/useScheduledPosts';
import PostPreviewDialog from './PostPreviewDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

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
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Debug logging to check data
  console.log('Calendar View - Posts:', posts);
  console.log('Calendar View - Selected Date:', selectedDate);
  console.log('Calendar View - User Timezone:', userTimezone);

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
    if (!date) return [];
    
    return posts.filter(post => {
      try {
        if (!post.next_run_at) return false;
        
        const postDate = parseISO(post.next_run_at);
        // Convert to user timezone for accurate comparison
        const postDateInUserTz = toZonedTime(postDate, post.timezone || userTimezone);
        const dateInUserTz = toZonedTime(date, userTimezone);
        
        // Debug log for date comparison
        console.log(`Comparing post date ${format(postDateInUserTz, 'yyyy-MM-dd')} with selected ${format(dateInUserTz, 'yyyy-MM-dd')}`);
        
        return isSameDay(postDateInUserTz, dateInUserTz);
      } catch (error) {
        console.error("Error comparing dates:", error);
        return false;
      }
    });
  };

  // Handle opening dialog for post preview
  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  // Handle saving post content
  const handleSavePost = async (postId: string, content: string) => {
    try {
      // Here you would implement the API call to update the post content
      console.log("Saving post content for:", postId, content);
      
      // Placeholder for API call
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Find the post to get its content_id
      const post = posts.find(p => p.id === postId);
      if (!post || !post.content_ideas?.id) {
        throw new Error("Post not found or missing content ID");
      }
      
      // Update the content in the database
      const { error } = await supabase
        .from('content_ideas')
        .update({ content })
        .eq('id', post.content_ideas.id);
        
      if (error) throw error;
      
      // Show success toast
      toast({
        title: "Post Updated",
        description: "Your post content has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving post:", error);
      // Show error toast
      toast({
        title: "Update Failed",
        description: "Failed to update post content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle regenerating post content
  const handleRegeneratePost = async (postId: string) => {
    try {
      setIsRegenerating(true);
      console.log("Regenerating content for post:", postId);
      
      // Find the post to get its content_ideas
      const post = posts.find(p => p.id === postId);
      if (!post || !post.content_ideas?.id) {
        throw new Error("Post not found or missing content ID");
      }
      
      // Use the post title as the topic for generation
      const topic = post.content_ideas.title;
      
      // Call the generate-content function to regenerate content
      const { data: generatedContent, error: generationError } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: topic,
          quantity: 1,
        },
      });
      
      if (generationError) throw generationError;
      
      if (!generatedContent || !Array.isArray(generatedContent) || generatedContent.length === 0) {
        throw new Error("No content was generated");
      }
      
      // Get the first (and only) generated content item
      const newContent = generatedContent[0].content;
      
      // Update the post in database
      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ 
          content: newContent
        })
        .eq('id', post.content_ideas.id);
      
      if (updateError) throw updateError;
      
      // Update the selected post in state to reflect changes immediately
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          content_ideas: {
            ...selectedPost.content_ideas,
            content: newContent
          }
        });
      }
      
      // Show success toast
      toast({
        title: "Content Regenerated",
        description: "Your post content has been refreshed with AI.",
      });
    } catch (error) {
      console.error("Error regenerating content:", error);
      // Show error toast
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate post content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Custom day renderer to show post titles directly on calendar
  const renderDay = (day: Date) => {
    const postsOnDay = getPostsForDate(day);
    
    return (
      <div className="h-full w-full p-1 flex flex-col">
        <div className="text-right mb-1 font-medium">{day.getDate()}</div>
        
        <div className="flex-grow">
          {postsOnDay.length > 0 ? (
            <div className="space-y-1 overflow-hidden max-h-[60px]">
              {postsOnDay.slice(0, 3).map((post, index) => {
                // Check if this post is in the past
                const postDate = parseISO(post.next_run_at);
                const now = new Date();
                const isPastDate = postDate < now;
                
                return (
                  <TooltipProvider key={post.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "text-xs p-1 rounded cursor-pointer",
                            isPastDate ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary-foreground/90",
                            "line-clamp-2 break-words"
                          )}
                          onClick={(e) => {
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            handlePostClick(post);
                          }}
                        >
                          {post.content_ideas?.title || "Untitled"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[300px]">
                        <p className="font-medium">{post.content_ideas?.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeInTimezone(post.next_run_at, post.timezone || userTimezone)}
                        </p>
                        {isPastDate && (
                          <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-800 border-amber-200">
                            Past Due
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              {postsOnDay.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{postsOnDay.length - 3} more
                </div>
              )}
            </div>
          ) : (
            <div className="h-full"></div>
          )}
        </div>
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
            <div className="overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                onMonthChange={setMonth}
                month={month}
                className="w-full border rounded-md p-3 pointer-events-auto"
                classNames={{
                  day_today: "bg-muted text-muted-foreground font-normal",
                  day_selected: "bg-primary/20 text-primary font-bold",
                  day: "h-full aspect-square p-0",
                  cell: "h-24 w-full relative p-0 border-t",
                  head_cell: "text-muted-foreground font-semibold text-xs uppercase text-center",
                  head_row: "flex w-full border-b",
                  row: "flex w-full",
                  table: "w-full border-collapse table-fixed",
                  months: "w-full",
                  month: "w-full"
                }}
                components={{
                  Day: ({ date, ...props }) => renderDay(date)
                }}
              />
            </div>
            
            {selectedDate && selectedDatePosts.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">
                  Post Details for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <div className="space-y-4">
                  {selectedDatePosts.map(post => {
                    // Use the post's timezone if available, otherwise fall back to user timezone
                    const postTimezone = post.timezone || userTimezone || 'UTC';
                    const postDate = parseISO(post.next_run_at);
                    const now = new Date();
                    const isPastDate = postDate < now;
                    
                    return (
                      <div 
                        key={post.id} 
                        className={`border rounded-md p-4 ${isPastDate ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-900'}`}
                      >
                        <div className="flex flex-col space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 
                              className="font-medium cursor-pointer hover:text-primary hover:underline" 
                              onClick={() => handlePostClick(post)}
                            >
                              {post.content_ideas?.title || "Untitled Post"}
                            </h3>
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
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Post Preview Dialog */}
      <PostPreviewDialog
        post={selectedPost}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPost(null);
        }}
        onSave={handleSavePost}
        onRegenerate={handleRegeneratePost}
        isRegenerating={isRegenerating}
      />
    </Card>
  );
}
