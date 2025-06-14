
import React from 'react';
import GenerationForm from '../components/data-seed/GenerationForm';
import ContentTable from '../components/data-seed/ContentTable';
import ContentSocialPreviewDialog from '../components/social-preview/ContentSocialPreviewDialog';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { Loader } from 'lucide-react';
import type { ContentItem, GenerationOptions } from '@/types/content';
import { PremiumBadge } from '@/components/ui/premium-badge';

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
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleRegenerate = async (id: string) => {
    setIsRegenerating(true);
    try {
      const item = generatedContent.find(content => content.id === id);
      if (item) {
        await regenerateContent(id, item.title);
        const updatedContent = generatedContent.find(content => content.id === id);
        if (updatedContent) {
          setSelectedContent(updatedContent);
        }
      }
    } finally {
      setIsRegenerating(false);
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
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Data Seed
            <PremiumBadge />
          </h1>
          <p className="text-muted-foreground">Generate content ideas using AI</p>
        </div>
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

      <ContentSocialPreviewDialog 
        content={selectedContent}
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        onUpdate={updateContent}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    </div>
  );
};

export default DataSeed;
