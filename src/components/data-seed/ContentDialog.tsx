
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  onRegenerate?: (id: string) => Promise<void>;
}

const ContentDialog = ({ content, onClose, onUpdate, onRegenerate }: ContentDialogProps) => {
  const [editedContent, setEditedContent] = React.useState('');
  const [isRegenerating, setIsRegenerating] = React.useState(false);

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

  const handleRegenerate = async () => {
    if (content && onRegenerate) {
      setIsRegenerating(true);
      await onRegenerate(content.id);
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={!!content} onOpenChange={onClose}>
      {content && (
        <DialogContent className="max-w-4xl w-[90vw] h-auto max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>{content.title}</DialogTitle>
              {content.status && (
                <DialogDescription>
                  Status: <span className={`font-medium ${content.status === 'Published' ? 'text-green-500' : 'text-blue-500'}`}>{content.status}</span>
                </DialogDescription>
              )}
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
