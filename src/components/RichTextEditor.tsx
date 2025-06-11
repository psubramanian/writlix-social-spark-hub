
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
  onContentChange?: (html: string, text: string) => void; // Legacy support
  readOnly?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor = ({ 
  content, 
  onChange, 
  onContentChange, 
  readOnly = false, 
  placeholder, 
  disabled = false 
}: RichTextEditorProps) => {
  const [showToolbar, setShowToolbar] = useState(true);
  const [editorContent, setEditorContent] = useState(content);
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Update editor content when props change
  useEffect(() => {
    setEditorContent(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleCommand = (command: string, value: string | null = null) => {
    if (readOnly || disabled) return;
    
    document.execCommand(command, false, value);
    // Get the updated content from the contentEditable div
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      
      // Call the appropriate onChange handler
      if (onChange) {
        onChange(newContent);
      }
      if (onContentChange) {
        const textContent = editorRef.current.innerText || '';
        onContentChange(newContent, textContent);
      }
    }
  };

  const handleLinkInsert = () => {
    if (readOnly || disabled) return;

    const url = prompt('Enter URL:', 'https://');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (!readOnly && !disabled) {
      const newContent = e.currentTarget.innerHTML;
      setEditorContent(newContent);
      
      // Call the appropriate onChange handler
      if (onChange) {
        onChange(newContent);
      }
      if (onContentChange) {
        const textContent = e.currentTarget.innerText || '';
        onContentChange(newContent, textContent);
      }
    }
  };

  const handleBlur = () => {
    if (!readOnly && !disabled && editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      
      // Call the appropriate onChange handler
      if (onChange) {
        onChange(newContent);
      }
      if (onContentChange) {
        const textContent = editorRef.current.innerText || '';
        onContentChange(newContent, textContent);
      }
    }
  };

  return (
    <div className="w-full border rounded-md">
      {showToolbar && !readOnly && !disabled && (
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
        <div className="relative w-full min-h-[320px]">
          <div
            ref={editorRef}
            id="rich-text-editor"
            className={cn(
              "w-full p-4 focus:outline-none min-h-[320px]",
              "prose prose-sm max-w-none",
              "focus:ring-0 text-left",
              (readOnly || disabled) ? "bg-muted/10 cursor-default" : ""
            )}
            contentEditable={!readOnly && !disabled}
            dangerouslySetInnerHTML={{ __html: editorContent }}
            onInput={handleContentChange}
            onBlur={handleBlur}
            suppressContentEditableWarning
            dir="ltr"
          />
          {!editorContent && placeholder && (
            <div className="absolute top-4 left-4 pointer-events-none text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RichTextEditor;
