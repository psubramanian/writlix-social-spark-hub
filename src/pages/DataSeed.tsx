
import React from 'react';
import GenerationForm from '../components/data-seed/GenerationForm';
import ContentTable from '../components/data-seed/ContentTable';
import ContentDialog from '../components/data-seed/ContentDialog';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { Loader } from 'lucide-react';
import type { ContentItem, GenerationOptions } from '@/types/content';

const DataSeed = () => {
  const {
    generating,
    loading,
    generatedContent,
    generateContent,
    regenerateContent,
    toggleStatus,
    deleteContent,
    importFromCsv,
    updateContent,
  } = useContentGeneration();
  
  const [selectedContent, setSelectedContent] = React.useState<ContentItem | null>(null);

  const handleRegenerate = async (id: string) => {
    const item = generatedContent.find(content => content.id === id);
    if (item) {
      await regenerateContent(id, item.title);
      const updatedContent = generatedContent.find(content => content.id === id);
      if (updatedContent) {
        setSelectedContent(updatedContent);
      }
    }
  };

  // Adapter function to bridge the API change from (seed: string, quantity: number) 
  // to ({ topic, quantity }: GenerationOptions)
  const handleGenerate = (seed: string, quantity: number) => {
    return generateContent({ topic: seed, quantity });
  };

  return (
    <div className="p-6 relative">
      {generating && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating ideas...</p>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Data Seed</h1>
        <p className="text-muted-foreground">Generate content ideas using AI</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GenerationForm 
          onGenerate={handleGenerate}
          onCsvImport={importFromCsv}
          isGenerating={generating}
        />
        
        <ContentTable 
          content={generatedContent}
          onStatusToggle={toggleStatus}
          onDelete={deleteContent}
          onPreview={setSelectedContent}
          isGenerating={loading || generating}
        />
      </div>

      <ContentDialog 
        content={selectedContent}
        onClose={() => setSelectedContent(null)}
        onUpdate={updateContent}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
};

export default DataSeed;
