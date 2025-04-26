
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchedulePostForm from '../components/SchedulePostForm';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useToast } from '@/components/ui/use-toast';
import { CurrentScheduleCard } from '@/components/schedule/CurrentScheduleCard';
import { ScheduledPostsList } from '@/components/schedule/ScheduledPostsList';
import { usePostOperations } from '@/hooks/usePostOperations';

const Schedule = () => {
  const { posts, loading: postsLoading, userSettings } = useScheduledPosts();
  const { postToLinkedIn } = usePostOperations();
  const [postingId, setPostingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter out posts that are already published
  const scheduledPosts = posts.filter(post => post.content_ideas?.status !== 'Published');

  const handleScheduleSubmit = (settings: any) => {
    toast({
      title: "Schedule Updated",
      description: "Your posting schedule has been updated.",
    });
  };

  const handlePostNow = async (postId: string) => {
    try {
      setPostingId(postId);
      const result = await postToLinkedIn(postId);
      
      if (result) {
        toast({
          title: "LinkedIn Post Sent",
          description: "Your content has been posted to LinkedIn successfully.",
        });
      }
    } catch (error) {
      console.error("Error in post handler:", error);
    } finally {
      setPostingId(null);
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
                  <CurrentScheduleCard settings={userSettings} />
                  <SchedulePostForm 
                    onSchedule={handleScheduleSubmit} 
                    initialValues={userSettings}
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <ScheduledPostsList
                    posts={scheduledPosts}
                    postingId={postingId}
                    onPostNow={handlePostNow}
                    loading={postsLoading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Schedule;
