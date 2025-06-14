
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem, GenerationOptions } from '@/types/content';

export const useContentGenerate = (setGeneratedContent: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateContent = async ({ topic, quantity }: GenerationOptions) => {
    setGenerating(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to generate content",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { data: generationData, error: generationError } = await supabase.functions.invoke('generate-content', {
        body: {
          topic,
          quantity,
        },
      });

      if (generationError) {
        console.error('Generation error:', generationError);
        throw new Error(generationError.message || 'Failed to generate content');
      }

      if (!generationData || !Array.isArray(generationData)) {
        console.error('Invalid generation data:', generationData);
        throw new Error('Invalid response from content generation service');
      }

      console.log('Generated content data:', generationData);
      
      const newContentItems: ContentItem[] = [];
      
      for (const item of generationData) {
        // Ensure the content has proper HTML formatting
        const formattedContent = ensureHtmlFormatting(item.content);
        
        const { data: dbData, error: dbError } = await supabase
          .from('content_ideas')
          .insert({
            title: String(item.title),
            content: String(formattedContent),
            status: 'Review',
            user_id: user.id
          } as any)
          .select();

        if (dbError) {
          console.error('Database insertion error:', dbError);
          throw new Error(`Failed to save content to database: ${dbError.message}`);
        }

        if (dbData && Array.isArray(dbData) && dbData.length > 0 && dbData[0]) {
          const insertedRecord = dbData[0] as any;
          if (insertedRecord?.id) {
            newContentItems.push({
              id: `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: item.title,
              preview: item.preview,
              content: formattedContent,
              status: 'Review',
              db_id: insertedRecord.id
            });
          }
        }
      }

      setGeneratedContent(prevContent => [...prevContent, ...newContentItems]);
      
      toast({
        title: "Content Generated",
        description: `${newContentItems.length} new post ideas have been added and saved to the database.`,
      });
    } catch (error: any) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to connect to AI service',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Helper function to ensure content has proper HTML formatting
  const ensureHtmlFormatting = (content: string): string => {
    // If content doesn't contain any HTML tags, wrap it in paragraphs
    if (!content.includes('<')) {
      // Split by double newlines and wrap each part in a paragraph
      return content
        .split(/\n\s*\n/)
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }
    return content;
  };

  return {
    generating,
    generateContent
  };
};
