
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Linkedin, Facebook, Instagram, Edit, Eye } from "lucide-react";
import LinkedInPreview from './previews/LinkedInPreview';
import FacebookPreview from './previews/FacebookPreview';
import InstagramPreview from './previews/InstagramPreview';
import RichTextEditor from './RichTextEditor';
import { useSocialPreview } from '../hooks/useSocialPreview';

interface SocialMediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  imageUrl?: string;
  selectedPlatforms: string[];
  onPostToLinkedIn: () => void;
  onPostToFacebook: () => void;
  onPostToInstagram: () => void;
  isPosting: boolean;
  postingPlatform: string | null;
  onContentChange?: (content: string) => void;
}

const SocialMediaPreviewDialog: React.FC<SocialMediaPreviewDialogProps> = ({
  open,
  onOpenChange,
  content,
  imageUrl,
  selectedPlatforms,
  onPostToLinkedIn,
  onPostToFacebook,
  onPostToInstagram,
  isPosting,
  postingPlatform,
  onContentChange
}) => {
  const { profiles, loading } = useSocialPreview();
  const [selectedPlatform, setSelectedPlatform] = useState(selectedPlatforms[0] || 'linkedin');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  if (!content.trim()) {
    return null;
  }

  const handleContentUpdate = (newContent: string) => {
    setEditedContent(newContent);
  };

  const handleSaveEdit = () => {
    if (onContentChange) {
      onContentChange(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const currentContent = isEditing ? editedContent : content;

  const renderPreview = () => {
    switch (selectedPlatform) {
      case 'linkedin':
        return (
          <LinkedInPreview
            content={currentContent}
            imageUrl={imageUrl}
            userProfile={profiles.linkedin}
            onPost={onPostToLinkedIn}
            isPosting={isPosting && postingPlatform === 'linkedin'}
          />
        );
      case 'facebook':
        return (
          <FacebookPreview
            content={currentContent}
            imageUrl={imageUrl}
            userProfile={profiles.facebook}
            onPost={onPostToFacebook}
            isPosting={isPosting && postingPlatform === 'facebook'}
          />
        );
      case 'instagram':
        return (
          <InstagramPreview
            content={currentContent}
            imageUrl={imageUrl}
            userProfile={profiles.instagram}
            onPost={onPostToInstagram}
            isPosting={isPosting && postingPlatform === 'instagram'}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview & Post</DialogTitle>
          <DialogDescription>
            Select a platform, edit your content if needed, and preview before posting
          </DialogDescription>
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
                {selectedPlatforms.includes('linkedin') && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="linkedin" id="linkedin" />
                    <Label htmlFor="linkedin" className="flex items-center gap-2 cursor-pointer">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      LinkedIn
                    </Label>
                  </div>
                )}
                {selectedPlatforms.includes('facebook') && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="facebook" id="facebook" />
                    <Label htmlFor="facebook" className="flex items-center gap-2 cursor-pointer">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Label>
                  </div>
                )}
                {selectedPlatforms.includes('instagram') && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="instagram" id="instagram" />
                    <Label htmlFor="instagram" className="flex items-center gap-2 cursor-pointer">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </Label>
                  </div>
                )}
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

            {/* Character Count & Platform Info */}
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

export default SocialMediaPreviewDialog;
