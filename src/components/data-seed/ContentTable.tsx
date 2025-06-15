"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ContentItem, ContentTableProps } from '@/types/content';

const ContentTable: React.FC<ContentTableProps> = ({
  content,
  onStatusToggle,
  onDelete,
  onPreview,
  isGenerating = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter out published content and calculate pagination
  const filteredContent = content.filter(item => item.status !== 'Published');
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, startIndex + itemsPerPage);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    const cleaned = stripHtml(text);
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
  };

  const getStatusColor = (status: ContentItem['status']) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200';
      case 'Review':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-200';
    }
  };

  if (isGenerating && filteredContent.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gradient-to-r from-purple-100/50 to-blue-100/50 h-16 rounded-xl border border-purple-200/30" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredContent.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-2xl p-8 border-2 border-dashed border-purple-300">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Eye className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No content yet</h3>
          <p className="text-slate-500">Generate your first batch of social media content ideas to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="space-y-3">
        {paginatedContent.map((item) => (
          <div
            key={item.id}
            className="bg-white/80 border border-purple-200/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Content Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 mb-2 truncate">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  {truncateText(item.preview || item.content, 120)}
                </p>
                
                {/* Status Badge */}
                <Badge 
                  className={`${getStatusColor(item.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => onStatusToggle(item.id)}
                >
                  {item.status}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreview(item)}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 rounded-lg"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-purple-200/30 pt-4">
          <p className="text-sm text-slate-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredContent.length)} of {filteredContent.length} items
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium text-slate-700 px-3">
              {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTable;