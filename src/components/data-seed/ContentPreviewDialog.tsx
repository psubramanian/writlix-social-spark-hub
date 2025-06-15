"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  Edit3, 
  Save, 
  X, 
  Hash,
  AtSign,
  Clock
} from 'lucide-react';
import type { ContentItem } from '@/types/content';

interface ContentPreviewDialogProps {
  content: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedContent: ContentItem) => void;
}

const ContentPreviewDialog: React.FC<ContentPreviewDialogProps> = ({
  content,
  open,
  onOpenChange,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');

  // Reset editing state when dialog opens/closes or content changes
  React.useEffect(() => {
    if (content && open) {
      setEditedContent(content.content);
      setEditedTitle(content.title);
      setIsEditing(false);
    }
  }, [content, open]);

  if (!content) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...content,
        title: editedTitle,
        content: editedContent,
        preview: editedContent.substring(0, 200) + (editedContent.length > 200 ? '...' : '')
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content.content);
    setEditedTitle(content.title);
    setIsEditing(false);
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

  const formatContentForDisplay = (text: string) => {
    // Basic formatting for display - convert line breaks and handle basic formatting
    return text
      .split('\n')
      .map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
  };

  const extractHashtags = (text: string) => {
    const hashtags = text.match(/#[\w]+/g) || [];
    return [...new Set(hashtags)];
  };

  const extractMentions = (text: string) => {
    const mentions = text.match(/@[\w]+/g) || [];
    return [...new Set(mentions)];
  };

  const hashtags = extractHashtags(content.content);
  const mentions = extractMentions(content.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[95vw] max-h-[95vh] overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
        <DialogHeader className="border-b border-purple-200/30 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-bold bg-transparent border-none outline-none focus:bg-white/50 rounded px-2 py-1 w-full"
                  placeholder="Content title..."
                />
              ) : (
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-purple-700 bg-clip-text text-transparent">
                  {content.title}
                </DialogTitle>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusColor(content.status)}>
                  {content.status}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  {new Date(content.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 py-6 space-y-8">
          {/* Content Preview/Edit */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Content Preview
            </h3>
            
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Write your social media content..."
                className="min-h-[250px] resize-none border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 text-base"
              />
            ) : (
              <div className="bg-white/60 border border-purple-200/50 rounded-lg p-8 min-h-[250px]">
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                  {formatContentForDisplay(content.content)}
                </div>
              </div>
            )}
          </div>

          {/* Platform Previews */}
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-700 text-lg">Platform Previews</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* LinkedIn Preview */}
              <div className="bg-white/60 border border-purple-200/50 rounded-lg p-5 min-h-[180px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">in</span>
                  </div>
                  <span className="font-semibold text-slate-700">LinkedIn</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-5 leading-relaxed">
                  {content.content.substring(0, 200)}
                  {content.content.length > 200 && '...'}
                </div>
              </div>

              {/* Twitter/X Preview */}
              <div className="bg-white/60 border border-purple-200/50 rounded-lg p-5 min-h-[180px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">𝕏</span>
                  </div>
                  <span className="font-semibold text-slate-700">X (Twitter)</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                  {content.content.substring(0, 280)}
                  {content.content.length > 280 && '...'}
                </div>
                <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-200">
                  {content.content.length}/280 characters
                </div>
              </div>

              {/* Facebook Preview */}
              <div className="bg-white/60 border border-purple-200/50 rounded-lg p-5 min-h-[180px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">f</span>
                  </div>
                  <span className="font-semibold text-slate-700">Facebook</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-5 leading-relaxed">
                  {content.content}
                </div>
              </div>

              {/* Instagram Preview */}
              <div className="bg-white/60 border border-purple-200/50 rounded-lg p-5 min-h-[180px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📷</span>
                  </div>
                  <span className="font-semibold text-slate-700">Instagram</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                  {content.content.substring(0, 150)}
                  {content.content.length > 150 && '...'}
                </div>
              </div>
            </div>
          </div>

          {/* Content Analytics */}
          {(hashtags.length > 0 || mentions.length > 0) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Content Elements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hashtags.length > 0 && (
                  <div className="bg-white/60 border border-purple-200/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-slate-700">Hashtags ({hashtags.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mentions.length > 0 && (
                  <div className="bg-white/60 border border-purple-200/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AtSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-slate-700">Mentions ({mentions.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mentions.map((mention, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {mention}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewDialog;