
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchedulePostForm from '../components/SchedulePostForm';
import { useScheduledPosts } from '../hooks/useScheduledPosts';

const Schedule = () => {
  const { posts, loading, createPost } = useScheduledPosts();

  const handleSchedulePost = (title: string, content: string, settings: any) => {
    createPost(title, content, settings);
  };

  const formatScheduleTime = (post: any) => {
    if (!post.schedule_settings?.[0]) return 'Not scheduled';
    
    const settings = post.schedule_settings[0];
    const nextRun = new Date(settings.next_run_at);
    const time = settings.time_of_day;
    
    switch (settings.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        return `Weekly on ${format(nextRun, 'EEEE')} at ${time}`;
      case 'monthly':
        return `Monthly on day ${settings.day_of_month} at ${time}`;
      default:
        return 'Schedule not set';
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
          
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
              </TabsList>
              
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar View
              </Button>
            </div>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <SchedulePostForm onSchedule={handleSchedulePost} />
                </div>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Scheduled Posts</CardTitle>
                    <CardDescription>Manage your upcoming LinkedIn posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-12">Loading...</div>
                    ) : posts.length > 0 ? (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div 
                            key={post.id} 
                            className="border rounded-md p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{post.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatScheduleTime(post)}
                                </p>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {post.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No posts scheduled yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Use the form to schedule your first post
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
