import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useScheduledPosts } from './useScheduledPosts';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

export const useContentGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { scheduleContentIdea } = useScheduledPosts();

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to view content",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user.id.toString());

      if (error) {
        console.error('Error fetching content:', error);
        toast({
          title: "Fetch Failed",
          description: error.message || 'Failed to fetch content ideas',
          variant: "destructive",
        });
        return;
      }

      const contentItems: ContentItem[] = data.map((item: any) => ({
        id: `content-${Date.now()}-${item.id}`,
        title: item.title,
        preview: item.content.substring(0, 100) + '...',
        content: item.content,
        status: item.status as 'Review' | 'Scheduled',
      }));

      setGeneratedContent(contentItems);
    } catch (error: any) {
      console.error('Content fetch error:', error);
      toast({
        title: "Fetch Error",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (seed: string, quantity: number) => {
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
            user_id: user.id.toString(),
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

  const toggleStatus = async (id: string) => {
    const item = generatedContent.find(content => content.id === id);
    if (!item) return;

    const newStatus = item.status === 'Review' ? 'Scheduled' : 'Review';

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to update content status",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { data: dbItem, error: fetchError } = await supabase
        .from('content_ideas')
        .select('id, title')
        .eq('title', item.title)
        .single();

      if (fetchError) {
        console.error('Error fetching item from database:', fetchError);
        throw fetchError;
      }

      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ status: newStatus })
        .eq('id', dbItem.id);

      if (updateError) throw updateError;

      if (newStatus === 'Scheduled') {
        const scheduled = await scheduleContentIdea(dbItem.id);
        if (!scheduled) {
          throw new Error("Failed to schedule the content");
        }
      }

      setGeneratedContent(prev =>
        prev.map(content =>
          content.id === id ? { ...content, status: newStatus } : content
        )
      );

      toast({
        title: "Status Updated",
        description: `Content status changed to ${newStatus}${newStatus === 'Scheduled' ? ' and added to your schedule' : ''}`,
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
      
      const item = generatedContent.find(content => content.id === id);
      if (!item) return;

      const { data: dbItem, error: fetchError } = await supabase
        .from('content_ideas')
        .select('id')
        .eq('title', item.title)
        .single();

      if (fetchError) {
        console.error('Error fetching item from database:', fetchError);
        throw fetchError;
      }

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

  const deleteContent = async (id: string) => {
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
      
      const item = generatedContent.find(content => content.id === id);
      if (!item) return;
      
      const { data: dbItem, error: fetchError } = await supabase
        .from('content_ideas')
        .select('id')
        .eq('title', item.title)
        .single();
        
      if (fetchError) {
        console.error('Error fetching item from database:', fetchError);
        setGeneratedContent(prev => prev.filter(item => item.id !== id));
        return;
      }
      
      const { error: deleteError } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', dbItem.id);
        
      if (deleteError) {
        console.error('Error deleting from database:', deleteError);
        throw deleteError;
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
    loading,
    generatedContent,
    generateContent,
    toggleStatus,
    deleteContent,
    importFromCsv,
    updateContent,
    fetchAllContent,
  };
};
