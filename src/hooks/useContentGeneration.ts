
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
    // Check if user is authenticated
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
    
    setGenerating(true);
    
    try {
      // Call the edge function to generate content
      const { data: generationData, error: generationError } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: seed,
          quantity,
        },
      });

      if (generationError) throw new Error(generationError.message || 'Failed to generate content');

      // Process the generated content
      const newContentItems = generationData.map((item: any, index: number) => ({
        id: `content-${Date.now()}-${index}`,
        title: item.title,
        preview: item.preview,
        content: item.content,
        status: 'Review' as const,
      }));

      // Save each content item to the database
      for (const item of newContentItems) {
        const { error: dbError } = await supabase
          .from('content_ideas')
          .insert({
            title: item.title,
            content: item.content,
            status: item.status,
            // Store user_id as a string to match the RLS policy
            user_id: user.id.toString(),
          });

        if (dbError) {
          console.error('Database insertion error:', dbError);
          throw new Error(`Failed to save content to database: ${dbError.message}`);
        }
      }

      // Update the local state with new content
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

  const toggleStatus = async (id: string) => {
    const item = generatedContent.find(content => content.id === id);
    if (!item) return;

    const newStatus = item.status === 'Review' ? 'Scheduled' : 'Review';

    try {
      // Instead of parsing the ID, use a match on the database ID column
      // First, need to get the database ID for this item
      const { data: dbItem, error: fetchError } = await supabase
        .from('content_ideas')
        .select('id, title')
        .eq('title', item.title)
        .single();

      if (fetchError) {
        console.error('Error fetching item from database:', fetchError);
        throw fetchError;
      }

      // Now update using the database ID
      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ status: newStatus })
        .eq('id', dbItem.id);

      if (updateError) throw updateError;

      setGeneratedContent(prev =>
        prev.map(content =>
          content.id === id ? { ...content, status: newStatus } : content
        )
      );

      toast({
        title: "Status Updated",
        description: `Content status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Status update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const updateContent = async (id: string, content: string) => {
    try {
      // First, find the item in our local state to get its title
      const item = generatedContent.find(content => content.id === id);
      if (!item) return;

      // Look up the database ID using the title
      const { data: dbItem, error: fetchError } = await supabase
        .from('content_ideas')
        .select('id')
        .eq('title', item.title)
        .single();

      if (fetchError) {
        console.error('Error fetching item from database:', fetchError);
        throw fetchError;
      }

      // Update using the database ID
      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ content })
        .eq('id', dbItem.id);

      if (updateError) throw updateError;

      setGeneratedContent(prev =>
        prev.map(item =>
          item.id === id ? { ...item, content } : item
        )
      );

      toast({
        title: "Content Updated",
        description: "Your changes have been saved",
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
    updateContent,
  };
};
