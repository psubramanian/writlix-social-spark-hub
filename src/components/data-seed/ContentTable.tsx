
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Maximize2, Trash } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled' | 'Published';
}

interface ContentTableProps {
  content: ContentItem[];
  onStatusToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (content: ContentItem) => void;
  isGenerating: boolean;
}

const ITEMS_PER_PAGE = 10;

const ContentTable = ({ 
  content, 
  onStatusToggle, 
  onDelete, 
  onPreview,
  isGenerating 
}: ContentTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter out published content from the main view
  const filteredContent = content.filter(item => item.status !== 'Published');
  const totalPages = Math.max(1, Math.ceil(filteredContent.length / ITEMS_PER_PAGE));
  
  const paginatedContent = filteredContent.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Strip HTML tags for plain text display when needed
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };
  
  // Create a safe preview of HTML content
  const createRichTextPreview = (htmlContent: string) => {
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get the text content
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Truncate to a reasonable preview length
    return textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Generated Ideas</CardTitle>
        <CardDescription>Select ideas to save for scheduling</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredContent.length > 0 ? (
          <>
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
                {paginatedContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="relative">
                      <div className="line-clamp-2">
                        {/* Use preview text if available, otherwise create a preview from the content */}
                        {item.preview || createRichTextPreview(item.content)}
                      </div>
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
                        className={
                          item.status === 'Scheduled' 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                        }
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
            
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink 
                          isActive={currentPage === index + 1}
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
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
