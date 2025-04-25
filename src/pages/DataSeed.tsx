
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import GenerationForm from '../components/data-seed/GenerationForm';
import ContentTable from '../components/data-seed/ContentTable';
import ContentDialog from '../components/data-seed/ContentDialog';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

const DataSeed = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    fetchUser();
  }, [toast, navigate]);

  const handleGenerate = async (seed: string, quantity: number) => {
    if (!userId) {
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
            user_id: userId,
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

  const handleDelete = (id: string) => {
    setGeneratedContent(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Topic Deleted",
      description: "The selected topic has been removed.",
    });
  };

  const handleCsvData = (data: any[]) => {
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

  return (
    <div className="flex h-screen bg-writlix-lightgray">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Data Seed</h1>
            <p className="text-muted-foreground">Generate content ideas using AI</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GenerationForm 
              onGenerate={handleGenerate}
              onCsvImport={handleCsvData}
              isGenerating={generating}
            />
            
            <ContentTable 
              content={generatedContent}
              onStatusToggle={toggleStatus}
              onDelete={handleDelete}
              onPreview={setSelectedContent}
              isGenerating={generating}
            />
          </div>
        </main>
      </div>

      <ContentDialog 
        content={selectedContent}
        onClose={() => setSelectedContent(null)}
      />
    </div>
  );
};

export default DataSeed;
