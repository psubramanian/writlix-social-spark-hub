
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import RichTextEditor from '@/components/RichTextEditor';
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';

interface PostPreviewDialogProps {
  post: ScheduledPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (postId: string, content: string) => Promise<void>;
  onRegenerate: (postId: string) => Promise<void>;
  isRegenerating?: boolean;
}

const PostPreviewDialog = ({ 
  post, 
  isOpen, 
  onClose, 
  onSave, 
  onRegenerate,
  isRegenerating = false
}: PostPreviewDialogProps) => {
  const [content, setContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <Dialog open={isOpen && !!post} onOpenChange={(open) => !open && onClose()}>
      {post && (
        <DialogContent className="max-w-4xl w-[90vw] h-auto max-h-[90vh] overflow-hidden">
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
          
          <div className="mt-4 overflow-y-auto">
            <RichTextEditor 
              content={content} 
              onChange={setContent}
              placeholder="Post content will appear here"
              disabled={isRegenerating}
            />
          </div>
          
          <DialogFooter className="mt-4 flex justify-end space-x-2">
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
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default PostPreviewDialog;
