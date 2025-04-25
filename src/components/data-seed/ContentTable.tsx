
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Maximize2, Trash } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

interface ContentTableProps {
  content: ContentItem[];
  onStatusToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (content: ContentItem) => void;
  isGenerating: boolean;
}

const ContentTable = ({ 
  content, 
  onStatusToggle, 
  onDelete, 
  onPreview,
  isGenerating 
}: ContentTableProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Generated Ideas</CardTitle>
        <CardDescription>Select ideas to save for scheduling</CardDescription>
      </CardHeader>
      <CardContent>
        {content.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Topic</TableHead>
                <TableHead className="w-[40%]">Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="relative">
                    <div className="line-clamp-2">{item.preview}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => onPreview(item)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className={item.status === 'Scheduled' ? 'text-green-600' : 'text-yellow-600'}
                      onClick={() => onStatusToggle(item.id)}
                    >
                      {item.status}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-red-600"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isGenerating ? 'Generating ideas...' : 'No content ideas generated yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isGenerating ? 'Please wait...' : 'Enter a topic seed and click "Generate Ideas"'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentTable;
