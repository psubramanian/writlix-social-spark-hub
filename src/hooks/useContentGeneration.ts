
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

export const useContentGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateContent = async (seed: string, quantity: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to generate content",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    setGenerating(true);
    
    try {
      const { data: generationData, error: generationError } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: seed,
          quantity,
        },
      });

      if (generationError) throw new Error(generationError.message || 'Failed to generate content');

      const newContentItems = generationData.map((item: any, index: number) => ({
        id: `content-${Date.now()}-${index}`,
        title: item.title,
        preview: item.preview,
        content: item.content,
        status: 'Review' as const,
      }));

      for (const item of newContentItems) {
        const { error: dbError } = await supabase
          .from('content_ideas')
          .insert({
            title: item.title,
            content: item.content,
            status: item.status,
            user_id: user.id,
          });

        if (dbError) {
          console.error('Database insertion error:', dbError);
          throw new Error(`Failed to save content to database: ${dbError.message}`);
        }
      }

      setGeneratedContent(prevContent => [...prevContent, ...newContentItems]);
      toast({
        title: "Content Generated",
        description: `${quantity} new post ideas have been added and saved to the database.`,
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

  const toggleStatus = (id: string) => {
    setGeneratedContent(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'Review' ? 'Scheduled' : 'Review' }
          : item
      )
    );
  };

  const deleteContent = (id: string) => {
    setGeneratedContent(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Topic Deleted",
      description: "The selected topic has been removed.",
    });
  };

  const importFromCsv = (data: any[]) => {
    const contentFromCsv = data.map((row, index) => ({
      id: `csv-${Date.now()}-${index}`,
      title: row.title || row[0] || `Imported Topic ${index + 1}`,
      preview: row.preview || '',
      content: row.content || '',
      status: 'Review' as const,
    }));
    
    setGeneratedContent(contentFromCsv);
    toast({
      title: "CSV Imported",
      description: `${contentFromCsv.length} post ideas imported.`,
    });
  };

  return {
    generating,
    generatedContent,
    generateContent,
    toggleStatus,
    deleteContent,
    importFromCsv,
  };
};
