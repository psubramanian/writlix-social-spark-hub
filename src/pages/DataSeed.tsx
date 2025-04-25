
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import GenerationForm from '../components/data-seed/GenerationForm';
import ContentTable from '../components/data-seed/ContentTable';
import ContentDialog from '../components/data-seed/ContentDialog';
import { useContentGeneration } from '@/hooks/useContentGeneration';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

const DataSeed = () => {
  const {
    generating,
    generatedContent,
    generateContent,
    toggleStatus,
    deleteContent,
    importFromCsv,
    updateContent,
  } = useContentGeneration();
  
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

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
              onGenerate={generateContent}
              onCsvImport={importFromCsv}
              isGenerating={generating}
            />
            
            <ContentTable 
              content={generatedContent}
              onStatusToggle={toggleStatus}
              onDelete={deleteContent}
              onPreview={setSelectedContent}
              isGenerating={generating}
            />
          </div>
        </main>
      </div>

      <ContentDialog 
        content={selectedContent}
        onClose={() => setSelectedContent(null)}
        onUpdate={updateContent}
      />
    </div>
  );
};

export default DataSeed;
