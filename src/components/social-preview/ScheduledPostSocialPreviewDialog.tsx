
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Edit, Eye } from "lucide-react";
import { Linkedin, Facebook, Instagram } from "lucide-react";
import RichTextEditor from '@/components/RichTextEditor';
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import LinkedInPreview from '../previews/LinkedInPreview';
import FacebookPreview from '../previews/FacebookPreview';
import InstagramPreview from '../previews/InstagramPreview';
import { useSocialPreview } from '../../hooks/useSocialPreview';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';

interface ScheduledPostSocialPreviewDialogProps {
  post: ScheduledPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (postId: string, content: string) => Promise<void>;
  onRegenerate: (postId: string) => Promise<void>;
  onPostNow?: (postId: string, platform: string) => void;
  isRegenerating?: boolean;
}

const ScheduledPostSocialPreviewDialog = ({ 
  post, 
  isOpen, 
  onClose, 
  onSave, 
  onRegenerate,
  onPostNow,
  isRegenerating = false
}: ScheduledPostSocialPreviewDialogProps) => {
  const { profiles, loading } = useSocialPreview();
  const [selectedPlatform, setSelectedPlatform] = useState('linkedin');
  const [content, setContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Update content when post changes
  useEffect(() => {
    if (post?.content_ideas?.content) {
      setContent(post.content_ideas.content);
    }
  }, [post]);

  const handleSave = async () => {
    if (!post) return;
    
    setIsSaving(true);
    try {
      await onSave(post.id, content);
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!post) return;
    await onRegenerate(post.id);
  };

  const handlePostNow = () => {
    if (!post || !onPostNow) return;
    onPostNow(post.id, selectedPlatform);
  };
  
  // Format time in the proper timezone
  const formatTimeInTimezone = (dateString: string, timezone: string) => {
    try {
      const date = parseISO(dateString);
      return formatInTimeZone(date, timezone, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const renderPreview = () => {
    switch (selectedPlatform) {
      case 'linkedin':
        return (
          <LinkedInPreview
            content={content}
            userProfile={profiles.linkedin}
            onPost={handlePostNow}
            isPosting={false}
          />
        );
      case 'facebook':
        return (
          <FacebookPreview
            content={content}
            userProfile={profiles.facebook}
            onPost={handlePostNow}
            isPosting={false}
          />
        );
      case 'instagram':
        return (
          <InstagramPreview
            content={content}
            userProfile={profiles.instagram}
            onPost={handlePostNow}
            isPosting={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen && !!post} onOpenChange={(open) => !open && onClose()}>
      {post && (
        <DialogContent className="max-w-6xl w-[90vw] h-auto max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>{post.content_ideas?.title || "Untitled Post"}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>
                  Scheduled for {formatTimeInTimezone(post.next_run_at, post.timezone || 'UTC')}
                  {post.timezone !== 'UTC' ? ` (${post.timezone})` : ''}
                </span>
                {post.content_ideas?.status && (
                  <Badge variant="outline" className="ml-2">
                    {post.content_ideas.status}
                  </Badge>
                )}
              </DialogDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 overflow-y-auto">
            {/* Left Column - Platform Selection & Content Editor */}
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
                  <RichTextEditor 
                    content={content} 
                    onChange={setContent}
                    placeholder="Post content will appear here"
                    disabled={isRegenerating}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div
                      className="text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: content.replace(/<[^>]*>/g, '') }}
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
          
          <DialogFooter className="mt-4 flex justify-between">
            <div className="flex gap-2">
              {onPostNow && (
                <Button 
                  variant="secondary" 
                  onClick={handlePostNow}
                  className="flex items-center gap-2"
                >
                  Post to {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Now
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isRegenerating}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ScheduledPostSocialPreviewDialog;
