
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/content';

export const useContentRegeneration = (setGeneratedContent: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
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

      const { error: dbError } = await supabase
        .from('content_ideas')
        .update({
          content: String(newContent.content),
          title: String(newContent.title),
        } as any)
        .eq('id', currentContentItem.db_id as any);

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

  return {
    regenerateContent
  };
};
