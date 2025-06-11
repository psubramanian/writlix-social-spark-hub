
import { useContentFetch } from './useContentFetch';
import { useContentGenerate } from './useContentGenerate';
import { useContentOperations } from './useContentOperations';
import { usePostScheduling } from './usePostScheduling';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem, GenerationOptions } from '@/types/content';

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
  
  const { scheduleContentIdea } = usePostScheduling();

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
            title: String(item.title),
            content: String(item.content || item.preview || item.title),
            status: item.status,
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
            // Add to our local state with the database ID
            newContentItems.push({
              ...item,
              db_id: insertedRecord.id
            });
          }
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

  // Updated toggleStatus function to handle scheduling when status changes to "Scheduled"
  const toggleStatus = async (id: string) => {
    try {
      // Find the content item
      const item = generatedContent.find(content => content.id === id);
      if (!item) {
        console.error(`Content item with ID ${id} not found`);
        toast({
          title: "Status Update Failed",
          description: "Content item not found",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Toggling status for item:', item);
      
      // Toggle between Review and Scheduled
      const newStatus = item.status === 'Review' ? 'Scheduled' : 'Review';
      
      // First update the content status in the content_ideas table
      await updateContent(id, item.content, newStatus);
      
      // If changing to Scheduled, we need to create a scheduled post with next_run_at
      if (newStatus === 'Scheduled') {
        if (!item.db_id) {
          console.error('Cannot schedule item without database ID:', item);
          toast({
            title: "Scheduling Failed",
            description: "Item database reference is missing",
            variant: "destructive",
          });
          return;
        }
        
        console.log(`Creating scheduled post for content with db_id: ${item.db_id}`);
        const scheduled = await scheduleContentIdea(item.db_id);
        
        if (!scheduled) {
          // If scheduling failed, revert the status change
          console.error('Failed to schedule content, reverting status change');
          await updateContent(id, item.content, 'Review');
          
          toast({
            title: "Scheduling Failed",
            description: "Could not create scheduled post",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Post Scheduled",
            description: "Content has been scheduled successfully",
          });
        }
      } else {
        // Just show a status update toast for Review status
        toast({
          title: "Status Updated",
          description: `Item marked for ${newStatus}`,
        });
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast({
        title: "Status Update Failed",
        description: error.message || "An error occurred while updating content status",
        variant: "destructive",
      });
    }
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
    toggleStatus,
  };
};
