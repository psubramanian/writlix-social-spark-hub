
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled' | 'Published';
}

interface ContentDialogProps {
  content: ContentItem | null;
  onClose: () => void;
  onUpdate: (id: string, content: string) => void;
}

const ContentDialog = ({ content, onClose, onUpdate }: ContentDialogProps) => {
  const [editedContent, setEditedContent] = React.useState('');

  React.useEffect(() => {
    if (content) {
      setEditedContent(content.content);
    }
  }, [content]);

  const handleSave = () => {
    if (content && editedContent !== content.content) {
      onUpdate(content.id, editedContent);
    }
    onClose();
  };

  return (
    <Dialog open={!!content} onOpenChange={onClose}>
      {content && (
        <DialogContent className="max-w-4xl w-[90vw] h-auto max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{content.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-y-auto">
            <RichTextEditor 
              content={editedContent} 
              onChange={setEditedContent}
              readOnly={content.status === 'Published'}
            />
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {content.status === 'Published' ? 'Close' : 'Cancel'}
            </Button>
            {content.status !== 'Published' && (
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ContentDialog;
