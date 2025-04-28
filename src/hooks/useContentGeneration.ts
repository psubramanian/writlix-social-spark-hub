
import { useContentFetch } from './useContentFetch';
import { useContentGenerate } from './useContentGenerate';
import { useContentOperations } from './useContentOperations';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/content';

export const useContentGeneration = () => {
  const { 
    loading, 
    generatedContent, 
    setGeneratedContent, 
    fetchAllContent 
  } = useContentFetch();

  const { 
    generating, 
    generateContent 
  } = useContentGenerate(setGeneratedContent);

  const {
    regenerateContent,
    updateContent,
    deleteContent
  } = useContentOperations(setGeneratedContent);

  const { toast } = useToast();
  const navigate = useNavigate();

  const importFromCsv = async (data: any[]) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to import content",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const contentFromCsv = data.map((row, index) => ({
        id: `csv-${Date.now()}-${index}`,
        title: row.title || row[0] || `Imported Topic ${index + 1}`,
        preview: row.preview || '',
        content: row.content || '',
        status: 'Review' as const,
      }));

      const newContentItems: ContentItem[] = [];
      
      // Insert into database
      for (const item of contentFromCsv) {
        const { data: dbData, error: dbError } = await supabase
          .from('content_ideas')
          .insert({
            title: item.title,
            content: item.content || item.preview || item.title,
            status: item.status,
            user_id: user.id
          })
          .select();

        if (dbError) {
          console.error('Database insertion error:', dbError);
          throw new Error(`Failed to save content to database: ${dbError.message}`);
        }
        
        if (dbData && dbData.length > 0) {
          // Add to our local state with the database ID
          newContentItems.push({
            ...item,
            db_id: dbData[0].id
          });
        }
      }
      
      setGeneratedContent(prev => [...prev, ...newContentItems]);
      
      toast({
        title: "CSV Imported",
        description: `${newContentItems.length} post ideas imported and saved.`,
      });
    } catch (error: any) {
      console.error('CSV import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV content",
        variant: "destructive",
      });
    }
  };

  // Add a toggleStatus function since it's being used in DataSeed.tsx
  const toggleStatus = (id: string) => {
    // Find the content item
    const item = generatedContent.find(content => content.id === id);
    if (!item) return;
    
    // Toggle between Review and Scheduled
    const newStatus = item.status === 'Review' ? 'Scheduled' : 'Review';
    
    // Call updateContent to update the status
    updateContent(id, item.content, newStatus);
  };

  return {
    generating,
    loading,
    generatedContent,
    generateContent,
    regenerateContent,
    deleteContent,
    importFromCsv,
    updateContent,
    fetchAllContent,
    toggleStatus, // Export the new function
  };
};
