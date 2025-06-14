
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Linkedin, Facebook, Instagram, Edit, Eye, RefreshCw } from "lucide-react";
import LinkedInPreview from '../previews/LinkedInPreview';
import FacebookPreview from '../previews/FacebookPreview';
import InstagramPreview from '../previews/InstagramPreview';
import RichTextEditor from '../RichTextEditor';
import { useSocialPreview } from '../../hooks/useSocialPreview';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled' | 'Published';
}

interface ContentSocialPreviewDialogProps {
  content: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => Promise<void>;
  isRegenerating?: boolean;
}

const ContentSocialPreviewDialog = ({ 
  content, 
  isOpen, 
  onClose, 
  onUpdate,
  onRegenerate,
  isRegenerating = false
}: ContentSocialPreviewDialogProps) => {
  const { profiles, loading } = useSocialPreview();
  const [selectedPlatform, setSelectedPlatform] = useState('linkedin');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (content) {
      setEditedContent(content.content);
    }
  }, [content]);

  if (!content) return null;

  const handleContentUpdate = (newContent: string) => {
    setEditedContent(newContent);
  };

  const handleSaveEdit = () => {
    if (onUpdate && editedContent !== content.content) {
      onUpdate(content.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(content.content);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (content && onRegenerate) {
      await onRegenerate(content.id);
    }
  };

  const currentContent = isEditing ? editedContent : content.content;

  const renderPreview = () => {
    switch (selectedPlatform) {
      case 'linkedin':
        return (
          <LinkedInPreview
            content={currentContent}
            userProfile={profiles.linkedin}
            onPost={() => {}}
            isPosting={false}
          />
        );
      case 'facebook':
        return (
          <FacebookPreview
            content={currentContent}
            userProfile={profiles.facebook}
            onPost={() => {}}
            isPosting={false}
          />
        );
      case 'instagram':
        return (
          <InstagramPreview
            content={currentContent}
            userProfile={profiles.instagram}
            onPost={() => {}}
            isPosting={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>
                Preview and edit your content for different social media platforms
              </DialogDescription>
            </div>
            {content.status !== 'Published' && onRegenerate && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Content Editor & Platform Selection */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Platform to Preview</Label>
              <RadioGroup
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="linkedin" id="linkedin" />
                  <Label htmlFor="linkedin" className="flex items-center gap-2 cursor-pointer">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    LinkedIn
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="facebook" id="facebook" />
                  <Label htmlFor="facebook" className="flex items-center gap-2 cursor-pointer">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instagram" id="instagram" />
                  <Label htmlFor="instagram" className="flex items-center gap-2 cursor-pointer">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Content Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Content</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                  disabled={content.status === 'Published'}
                >
                  {isEditing ? (
                    <>
                      <Eye className="h-4 w-4" />
                      Preview Mode
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit Content
                    </>
                  )}
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <RichTextEditor
                    content={editedContent}
                    onChange={handleContentUpdate}
                    placeholder="Edit your post content..."
                    disabled={isRegenerating}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} size="sm">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: currentContent.replace(/<[^>]*>/g, '') }}
                  />
                </div>
              )}
            </div>

            {/* Platform-specific info */}
            <div className="text-xs text-gray-500">
              {selectedPlatform === 'linkedin' && (
                <div>LinkedIn: Recommended under 1,300 characters for optimal engagement</div>
              )}
              {selectedPlatform === 'facebook' && (
                <div>Facebook: Posts under 80 characters get 66% more engagement</div>
              )}
              {selectedPlatform === 'instagram' && (
                <div>Instagram: Caption limit is 2,200 characters, first 125 shown without "more"</div>
              )}
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Live Preview - {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</Label>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading preview...</div>
                </div>
              ) : (
                renderPreview()
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentSocialPreviewDialog;
