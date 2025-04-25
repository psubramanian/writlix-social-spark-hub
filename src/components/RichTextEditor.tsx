
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [showToolbar, setShowToolbar] = useState(true);

  const handleCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    // Get the updated content from the contentEditable div
    const editorElement = document.getElementById('rich-text-editor');
    if (editorElement) {
      onChange(editorElement.innerHTML);
    }
  };

  return (
    <div className="w-full border rounded-md">
      {showToolbar && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('bold')}
          >
            <Bold size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('italic')}
          >
            <Italic size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('underline')}
          >
            <Underline size={16} />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyLeft')}
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyCenter')}
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyRight')}
          >
            <AlignRight size={16} />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('insertUnorderedList')}
          >
            <List size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('insertOrderedList')}
          >
            <ListOrdered size={16} />
          </Button>
        </div>
      )}
      
      <ScrollArea className="h-[320px] w-full">
        <div
          id="rich-text-editor"
          className={cn(
            "w-full p-4 focus:outline-none min-h-[320px]",
            "prose prose-sm max-w-none",
            "focus:ring-0"
          )}
          contentEditable
          dangerouslySetInnerHTML={{ __html: content }}
          onBlur={(e) => onChange(e.currentTarget.innerHTML)}
          suppressContentEditableWarning
        />
      </ScrollArea>
    </div>
  );
};

export default RichTextEditor;
