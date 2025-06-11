
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/content';

export const useContentDeletion = (setGeneratedContent: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const deleteContent = async (id: string) => {
    console.log('Deleting content with ID:', id);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete content",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      // Fetch the current state to ensure we have the latest data
      let itemToDelete: ContentItem | undefined;
      setGeneratedContent(prevContent => {
        itemToDelete = prevContent.find(content => content.id === id);
        return prevContent;
      });
      
      if (!itemToDelete) {
        console.error('Item not found in local state:', id);
        return;
      }
      
      console.log('Found item to delete:', itemToDelete);
      
      if (itemToDelete.status === 'Published') {
        toast({
          title: "Cannot Delete",
          description: "Published content cannot be deleted",
          variant: "destructive",
        });
        return;
      }
      
      if (itemToDelete.db_id) {
        // The database trigger will automatically handle scheduled_posts cleanup
        // when the content_ideas record is deleted
        
        console.log('Deleting content with db_id:', itemToDelete.db_id);
        const { error: deleteError } = await supabase
          .from('content_ideas')
          .delete()
          .eq('id', itemToDelete.db_id as any);
          
        if (deleteError) {
          console.error('Error deleting from database:', deleteError);
          throw deleteError;
        }
      }

      setGeneratedContent(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Topic Deleted",
        description: "The selected topic has been removed.",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  return {
    deleteContent
  };
};
