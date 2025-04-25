
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

interface ContentDialogProps {
  content: ContentItem | null;
  onClose: () => void;
}

const ContentDialog = ({ content, onClose }: ContentDialogProps) => {
  return (
    <Dialog open={!!content} onOpenChange={onClose}>
      {content && (
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{content.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap">{content.content}</div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ContentDialog;
