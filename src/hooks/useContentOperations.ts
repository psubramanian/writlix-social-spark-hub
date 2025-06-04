
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/content';
import { Database } from '@/integrations/supabase/types';
import { asUserId, asContentId, asContentStatus } from '@/utils/supabase-helpers';

export const useContentOperations = (setGeneratedContent: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const regenerateContent = async (id: string, title: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to regenerate content",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Fetch the current state to ensure we have the latest data
      let currentContentItem: ContentItem | undefined;
      setGeneratedContent(prevContent => {
        currentContentItem = prevContent.find(content => content.id === id);
        return prevContent;
      });
      
      if (!currentContentItem || !currentContentItem.db_id) {
        throw new Error('Could not find content item to update');
      }

      const { data: generationData, error: generationError } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: title,
          quantity: 1,
        },
      });

      if (generationError) {
        console.error('Regeneration error:', generationError);
        throw new Error(generationError.message || 'Failed to regenerate content');
      }

      const newContent = generationData[0];
      if (!newContent) {
        throw new Error('No content was generated');
      }

      // Create typed update data
      const updateData: Database['public']['Tables']['content_ideas']['Update'] = {
        content: newContent.content,
        title: newContent.title,
      };

      const { error: dbError } = await supabase
        .from('content_ideas')
        .update(updateData)
        .eq('id', asContentId(currentContentItem.db_id));

      if (dbError) {
        console.error('Database update error:', dbError);
        throw dbError;
      }

      setGeneratedContent(prev =>
        prev.map(content =>
          content.id === id
            ? {
                ...content,
                title: newContent.title,
                preview: newContent.preview,
                content: newContent.content,
              }
            : content
        )
      );

      toast({
        title: "Content Regenerated",
        description: "Your content has been regenerated successfully.",
      });
    } catch (error: any) {
      console.error('Content regeneration error:', error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate content",
        variant: "destructive",
      });
    }
  };

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

      // Create typed update data
      const updateData: Database['public']['Tables']['content_ideas']['Update'] = { 
        content 
      };
      
      if (newStatus) {
        updateData.status = asContentStatus(newStatus);
      }

      if (currentItem.db_id) {
        const { error: updateError } = await supabase
          .from('content_ideas')
          .update(updateData)
          .eq('id', asContentId(currentItem.db_id));

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
          .eq('id', asContentId(itemToDelete.db_id));
          
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
    regenerateContent,
    updateContent,
    deleteContent
  };
};
