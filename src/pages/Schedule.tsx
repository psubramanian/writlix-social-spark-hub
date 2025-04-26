
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { format } from 'date-fns';
import { Send, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchedulePostForm from '../components/SchedulePostForm';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const Schedule = () => {
  const { posts, loading: postsLoading, scheduleContentIdea, postToLinkedIn, userSettings } = useScheduledPosts();
  const [postingId, setPostingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter out posts that are already published
  const scheduledPosts = posts.filter(post => post.content_ideas?.status !== 'Published');

  const formatScheduleTime = (post: any) => {
    if (!post.schedule_settings?.[0]) return 'Not scheduled';
    
    const settings = post.schedule_settings[0];
    const nextRun = new Date(settings.next_run_at);
    const time = settings.time_of_day;
    const timezone = settings.timezone || 'UTC';
    
    const formattedDate = format(nextRun, 'PPP');
    const formattedTime = format(nextRun, 'p');
    
    return `${formattedDate} at ${formattedTime} (${timezone})`;
  };

  const handlePostNow = async (postId: string) => {
    try {
      setPostingId(postId);
      await postToLinkedIn(postId);
      toast({
        title: "LinkedIn Post Sent",
        description: "Your content has been posted to LinkedIn successfully.",
      });
    } catch (error) {
      // Error is already handled in the hook
      console.error("Error in post handler:", error);
    } finally {
      setPostingId(null);
    }
  };

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return userSettings.dayOfWeek !== undefined ? 
        `Weekly on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][userSettings.dayOfWeek]}` : 
        'Weekly';
      case 'monthly': return userSettings.dayOfMonth !== undefined ? 
        `Monthly on day ${userSettings.dayOfMonth}` :
        'Monthly';
      default: return frequency;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">Plan and manage your LinkedIn posts</p>
          </div>
          
          <Tabs defaultValue="scheduled">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="scheduled" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Current Schedule
                      </CardTitle>
                      <CardDescription>
                        Your default posting schedule
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userSettings ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Frequency:</span>
                            <Badge variant="outline">{getFrequencyDisplay(userSettings.frequency)}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Time:</span>
                            <Badge variant="outline">{userSettings.timeOfDay}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Timezone:</span>
                            <Badge variant="outline">{userSettings.timezone}</Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">Loading your schedule...</div>
                      )}
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          Change your schedule below to update all scheduled posts.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <SchedulePostForm 
                    onSchedule={scheduleContentIdea} 
                    initialValues={userSettings}
                  />
                </div>
                
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Scheduled Posts</CardTitle>
                    <CardDescription>Manage your upcoming LinkedIn posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {postsLoading ? (
                      <div className="text-center py-12">Loading...</div>
                    ) : scheduledPosts.length > 0 ? (
                      <div className="space-y-4">
                        {scheduledPosts.map((post) => (
                          <div 
                            key={post.id} 
                            className="border rounded-md p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium">{post.content_ideas?.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatScheduleTime(post)}
                                </p>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {post.content_ideas?.status}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePostNow(post.id)}
                                disabled={postingId === post.id}
                                className="ml-4"
                              >
                                {postingId === post.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Post Now
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No posts scheduled yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Move posts from Review to Scheduled in the Data Seed page
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Schedule;
