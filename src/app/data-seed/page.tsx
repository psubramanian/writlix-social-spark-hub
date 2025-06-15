"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import GenerationForm from '@/components/data-seed/GenerationForm';
import ContentTable from '@/components/data-seed/ContentTable';
import { Loader } from 'lucide-react';
import type { ContentItem } from '@/types/content';

const DataSeed = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Mock content generation
  const handleGenerate = async (topic: string, quantity: number) => {
    setGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate mock content
    const mockContent: ContentItem[] = Array.from({ length: quantity }, (_, index) => ({
      id: `content-${Date.now()}-${index}`,
      title: `${topic} - Idea ${index + 1}`,
      preview: `This is a compelling preview for ${topic} that would make people want to read more...`,
      content: `<p>This is the full content for <strong>${topic}</strong>.</p><p>It includes detailed insights, actionable tips, and engaging storytelling that would perform well on LinkedIn.</p><ul><li>Key point 1</li><li>Key point 2</li><li>Key point 3</li></ul><p>What are your thoughts on this topic?</p>`,
      status: 'Review',
      createdAt: new Date(),
    }));
    
    setGeneratedContent(prev => [...mockContent, ...prev]);
    setGenerating(false);
  };

  const handleStatusToggle = (id: string) => {
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
  };

  const handlePreview = (content: ContentItem) => {
    setSelectedContent(content);
    // TODO: Open preview dialog
    console.log('Preview content:', content);
  };

  return (
    <AppLayout>
      {generating && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-purple-200/50">
            <Loader className="h-10 w-10 animate-spin text-purple-600" />
            <p className="text-lg font-medium bg-gradient-to-r from-black via-slate-800 to-purple-600 bg-clip-text text-transparent">
              Generating ideas...
            </p>
            <p className="text-sm text-slate-600">AI is crafting your social media content</p>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-black via-slate-800 to-purple-600 bg-clip-text text-transparent mb-2">
            Data Seed
          </h1>
          <p className="text-slate-600 text-lg">Generate engaging social media content ideas using AI</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Form */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white to-purple-50/50 border border-purple-200/30 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent mb-4">
              Generate Content
            </h2>
            <p className="text-slate-600 mb-6">Enter topics and let AI create engaging social media posts for you.</p>
            
            <GenerationForm 
              onGenerate={handleGenerate}
              isGenerating={generating}
            />
          </div>
        </div>
        
        {/* Content Table */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-purple-50/50 border border-purple-200/30 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent mb-4">
              Generated Content
            </h2>
            <p className="text-slate-600 mb-6">Review and manage your AI-generated social media posts.</p>
            
            <ContentTable 
              content={generatedContent}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDelete}
              onPreview={handlePreview}
              isGenerating={generating}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DataSeed;