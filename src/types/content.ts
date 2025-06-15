export interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled' | 'Published';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GenerationOptions {
  topic: string;
  quantity: number;
}

export interface ContentTableProps {
  content: ContentItem[];
  onStatusToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (content: ContentItem) => void;
  isGenerating?: boolean;
}