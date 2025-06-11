
export interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled' | 'Published';
  db_id?: number;
}

export interface GenerationOptions {
  topic: string;
  quantity: number;
}
