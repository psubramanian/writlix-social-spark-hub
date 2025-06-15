"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Upload } from 'lucide-react';

interface GenerationFormProps {
  onGenerate: (topic: string, quantity: number) => void;
  isGenerating?: boolean;
}

const GenerationForm: React.FC<GenerationFormProps> = ({ 
  onGenerate, 
  isGenerating = false 
}) => {
  const [topic, setTopic] = useState('');
  const [quantity, setQuantity] = useState([5]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerate(topic.trim(), quantity[0]);
    }
  };

  const isFormValid = topic.trim().length > 0 && !isGenerating;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Content Topics
          </label>
          <Textarea
            placeholder="Enter your topics here... (e.g., AI in healthcare, leadership strategies, remote work tips)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[120px] border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 rounded-xl resize-none"
            disabled={isGenerating}
          />
          <p className="text-xs text-slate-500">
            Separate multiple topics with commas for variety
          </p>
        </div>

        {/* Quantity Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Number of Ideas
            </label>
            <span className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {quantity[0]} {quantity[0] === 1 ? 'idea' : 'ideas'}
            </span>
          </div>
          <div className="px-2">
            <Slider
              value={quantity}
              onValueChange={setQuantity}
              max={20}
              min={1}
              step={1}
              className="w-full"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
            isFormValid
              ? 'bg-gradient-to-r from-black via-slate-800 to-purple-600 hover:from-slate-900 hover:via-slate-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Content
            </div>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-purple-200/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-slate-500 font-medium">or</span>
        </div>
      </div>

      {/* CSV Import */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700">
          Import from CSV
        </label>
        <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors bg-gradient-to-br from-purple-50/30 to-blue-50/30">
          <Upload className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-2">
            Drag and drop your CSV file here
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Format: title, preview, content
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
            disabled={isGenerating}
          >
            Choose File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerationForm;