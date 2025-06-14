
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/content';

export const useContentFetch = () => {
  const [loading, setLoading] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        .eq('user_id', user.id as any);

      if (error) {
        console.error('Error fetching content:', error);
        toast({
          title: "Fetch Failed",
          description: error.message || 'Failed to fetch content ideas',
          variant: "destructive",
        });
        return;
      }

      const contentItems: ContentItem[] = (data || []).map((item: any) => ({
        id: `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: item.title,
        preview: item.content.substring(0, 100) + '...',
        content: item.content,
        status: item.status as 'Review' | 'Scheduled' | 'Published',
        db_id: item.id
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

  useEffect(() => {
    fetchAllContent();
  }, []);

  return {
    loading,
    generatedContent,
    setGeneratedContent,
    fetchAllContent
  };
};
