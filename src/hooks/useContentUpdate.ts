
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/content';

export const useContentUpdate = (setGeneratedContent: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateContent = async (id: string, content: string, newStatus?: 'Review' | 'Scheduled' | 'Published') => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to update content",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      // Fetch the current state to ensure we have the latest data
      let currentItem: ContentItem | undefined;
      setGeneratedContent(prevContent => {
        currentItem = prevContent.find(item => item.id === id);
        return prevContent;
      });
      
      if (!currentItem) return;

      const updateData: { content: string; status?: string } = { 
        content: String(content) 
      };
      if (newStatus) {
        updateData.status = newStatus;
      }

      if (currentItem.db_id) {
        const { error: updateError } = await supabase
          .from('content_ideas')
          .update(updateData as any)
          .eq('id', currentItem.db_id as any);

        if (updateError) {
          console.error('Content update error:', updateError);
          throw updateError;
        }
        
        // The database trigger will automatically handle scheduled_posts cleanup
        // when status changes from 'Scheduled' to something else
      }

      setGeneratedContent(prev =>
        prev.map(item =>
          item.id === id ? { 
            ...item, 
            content, 
            preview: content.substring(0, 100) + '...',
            ...(newStatus ? { status: newStatus } : {})
          } : item
        )
      );

      toast({
        title: newStatus ? "Status Updated" : "Content Updated",
        description: newStatus ? `Item status changed to ${newStatus}` : "Your changes have been saved",
      });
    } catch (error: any) {
      console.error('Content update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update content",
        variant: "destructive",
      });
    }
  };

  return {
    updateContent
  };
};
