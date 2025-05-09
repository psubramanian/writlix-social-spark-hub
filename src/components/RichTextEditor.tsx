
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Link as LinkIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, readOnly = false, placeholder }: RichTextEditorProps) => {
  const [showToolbar, setShowToolbar] = useState(true);
  const [editorContent, setEditorContent] = useState(content);

  // Update editor content when props change
  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleCommand = (command: string, value: string | null = null) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    // Get the updated content from the contentEditable div
    const editorElement = document.getElementById('rich-text-editor');
    if (editorElement) {
      onChange(editorElement.innerHTML);
    }
  };

  const handleLinkInsert = () => {
    if (readOnly) return;

    const url = prompt('Enter URL:', 'https://');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (!readOnly) {
      const newContent = e.currentTarget.innerHTML;
      setEditorContent(newContent);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!readOnly) {
      const newContent = e.currentTarget.innerHTML;
      onChange(newContent);
    }
  };

  return (
    <div className="w-full border rounded-md">
      {showToolbar && !readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('underline')}
            title="Underline"
          >
            <Underline size={16} />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyLeft')}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyRight')}
            title="Align Right"
          >
            <AlignRight size={16} />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('insertUnorderedList')}
            title="Bullet List"
          >
            <List size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('insertOrderedList')}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLinkInsert}
            title="Insert Link"
          >
            <LinkIcon size={16} />
          </Button>
        </div>
      )}
      
      <ScrollArea className="h-[320px] w-full">
        <div
          id="rich-text-editor"
          className={cn(
            "w-full p-4 focus:outline-none min-h-[320px]",
            "prose prose-sm max-w-none",
            "focus:ring-0",
            readOnly ? "bg-muted/10 cursor-default" : "",
            "relative"
          )}
          contentEditable={!readOnly}
          dangerouslySetInnerHTML={{ __html: editorContent }}
          onInput={handleContentChange}
          onBlur={handleBlur}
          suppressContentEditableWarning
          data-placeholder={placeholder}
        />
        {!editorContent && placeholder && (
          <div className="absolute top-4 left-4 pointer-events-none text-gray-400">
            {placeholder}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default RichTextEditor;
