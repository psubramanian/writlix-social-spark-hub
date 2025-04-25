
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border">
      <textarea
        className="w-full h-full p-4 focus:outline-none resize-none"
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    </ScrollArea>
  );
};

export default RichTextEditor;
