
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import ContentDialog from '@/components/data-seed/ContentDialog';

interface PublishedPost {
  id: string;
  title: string;
  content: string;
  preview: string;
  published_at: string;
}

const PublishedContent = () => {
  const [selectedContent, setSelectedContent] = React.useState<any>(null);

  const { data: publishedPosts, isLoading } = useQuery({
    queryKey: ['published-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('published_content')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as PublishedPost[];
    }
  });

  return (
    <div className="flex h-screen bg-writlix-lightgray">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Published Content</h1>
            <p className="text-muted-foreground">View your published content from the last 90 days</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>Your recently published content</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Title</TableHead>
                      <TableHead className="w-[40%]">Preview</TableHead>
                      <TableHead>Published At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedPosts?.map((post) => (
                      <TableRow 
                        key={post.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedContent({
                          ...post,
                          status: 'Published'
                        })}
                      >
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>{post.preview}</TableCell>
                        <TableCell>{format(new Date(post.published_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <ContentDialog 
        content={selectedContent}
        onClose={() => setSelectedContent(null)}
        onUpdate={() => {}} // Published content cannot be updated
      />
    </div>
  );
};

export default PublishedContent;
