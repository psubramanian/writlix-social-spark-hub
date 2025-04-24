
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ScheduleForm from '../components/ScheduleForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from 'lucide-react';

interface ScheduledPost {
  id: string;
  title: string;
  date: string;
  time: string;
  frequency: string;
  status: 'scheduled' | 'published' | 'failed';
}

const Schedule = () => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: 'post-1',
      title: '10 Ways AI Can Transform Your Business in 2025',
      date: '2025-04-25',
      time: '09:00',
      frequency: 'once',
      status: 'scheduled',
    },
    {
      id: 'post-2',
      title: 'The Future of Remote Work: Trends to Watch',
      date: '2025-04-27',
      time: '13:00',
      frequency: 'weekly',
      status: 'scheduled',
    },
    {
      id: 'post-3',
      title: 'How Machine Learning is Disrupting Traditional Industries',
      date: '2025-04-22',
      time: '10:30',
      frequency: 'once',
      status: 'published',
    },
  ]);
  
  const { toast } = useToast();
  
  const handleSchedulePost = (postData: any) => {
    const newPost = {
      id: `post-${Date.now()}`,
      ...postData,
      status: 'scheduled' as const,
    };
    
    setScheduledPosts([...scheduledPosts, newPost]);
    
    toast({
      title: "Post Scheduled",
      description: `Your post has been scheduled for ${postData.date} at ${postData.time}`,
    });
  };
  
  const handleDeletePost = (id: string) => {
    setScheduledPosts(scheduledPosts.filter(post => post.id !== id));
    
    toast({
      title: "Post Removed",
      description: "The scheduled post has been removed",
    });
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  return (
    <div className="flex h-screen bg-writlix-lightgray">
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
                <Card className="lg:col-span-1 h-min">
                  <CardHeader>
                    <CardTitle>Schedule New Post</CardTitle>
                    <CardDescription>Set up when to publish your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScheduleForm onSchedule={handleSchedulePost} />
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Scheduled Posts</CardTitle>
                    <CardDescription>Manage your upcoming LinkedIn posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scheduledPosts.length > 0 ? (
                      <div className="space-y-4">
                        {scheduledPosts.map((post) => (
                          <div 
                            key={post.id} 
                            className="border rounded-md p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{post.title}</h3>
                                <div className="flex items-center mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.status)}`}>
                                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-3">
                                    {formatDate(post.date)} at {post.time}
                                  </span>
                                  {post.frequency !== 'once' && (
                                    <span className="text-xs bg-gray-100 text-gray-800 ml-2 px-2 py-0.5 rounded-full">
                                      {post.frequency.charAt(0).toUpperCase() + post.frequency.slice(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {post.status === 'scheduled' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  Delete
                                </Button>
                              )}
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
            
            <TabsContent value="scheduled" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Posts</CardTitle>
                  <CardDescription>Posts waiting to be published</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scheduledPosts
                      .filter(post => post.status === 'scheduled')
                      .map((post) => (
                        <div 
                          key={post.id} 
                          className="border rounded-md p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{post.title}</h3>
                              <div className="flex items-center mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.status)}`}>
                                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                </span>
                                <span className="text-sm text-muted-foreground ml-3">
                                  {formatDate(post.date)} at {post.time}
                                </span>
                                {post.frequency !== 'once' && (
                                  <span className="text-xs bg-gray-100 text-gray-800 ml-2 px-2 py-0.5 rounded-full">
                                    {post.frequency.charAt(0).toUpperCase() + post.frequency.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="published" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Published Posts</CardTitle>
                  <CardDescription>Posts that have been published</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scheduledPosts
                      .filter(post => post.status === 'published')
                      .map((post) => (
                        <div 
                          key={post.id} 
                          className="border rounded-md p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{post.title}</h3>
                              <div className="flex items-center mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.status)}`}>
                                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                </span>
                                <span className="text-sm text-muted-foreground ml-3">
                                  {formatDate(post.date)} at {post.time}
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                            >
                              View Stats
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Schedule;
