import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchedulePostForm from '../components/SchedulePostForm';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useToast } from '@/components/ui/use-toast';
import { CurrentScheduleCard } from '@/components/schedule/CurrentScheduleCard';
import { ScheduledPostsList } from '@/components/schedule/ScheduledPostsList';
import { usePostOperations } from '@/hooks/usePostOperations';
import { LinkedInWarning } from '@/components/dashboard/LinkedInWarning';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useScheduleSettings } from '@/hooks/useScheduleSettings';

const Schedule = () => {
  const navigate = useNavigate();
  const { posts, loading: postsLoading, userSettings, fetchPosts } = useScheduledPosts();
  const { postToLinkedIn } = usePostOperations();
  const [postingId, setPostingId] = useState<string | null>(null);
  const [hasLinkedInConnection, setHasLinkedInConnection] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkLinkedInConnection = async () => {
      if (!user) {
        setCheckingConnection(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_linkedin_credentials')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        setHasLinkedInConnection(!!data?.access_token);
      } catch (error) {
        console.error('Error checking LinkedIn connection:', error);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    checkLinkedInConnection();
  }, [user]);

  const scheduledPosts = posts.filter(post => post.content_ideas?.status !== 'Published');

  const { updateUserSettings } = useScheduleSettings();

  const handleScheduleSubmit = async (settings: any) => {
    const success = await updateUserSettings(settings);
    if (success) {
      await fetchPosts();
    }
  };

  const handlePostNow = async (postId: string) => {
    if (!hasLinkedInConnection) {
      toast({
        title: "LinkedIn not connected",
        description: "Please connect your LinkedIn account in Settings first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setPostingId(postId);
      
      toast({
        title: "Posting to LinkedIn",
        description: "Sending your content to LinkedIn...",
      });
      
      const result = await postToLinkedIn(postId);
      
      if (result) {
        toast({
          title: "LinkedIn Post Sent",
          description: "Your content has been posted to LinkedIn successfully.",
        });
      }
    } catch (error: any) {
      console.error("Error in post handler:", error);
      
      const errorMessage = error.message || "There was an error posting to LinkedIn";
      
      toast({
        title: "Post Failed",
        description: errorMessage.includes("LinkedIn") ? errorMessage : "Failed to post to LinkedIn. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setPostingId(null);
    }
  };
  
  const handleConnectLinkedIn = () => {
    navigate('/settings?tab=connections');
  };

  return (
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
              {!checkingConnection && !hasLinkedInConnection && (
                <LinkedInWarning onClick={handleConnectLinkedIn} />
              )}
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
  );
};

export default Schedule;
