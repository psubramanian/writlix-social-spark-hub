
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import CSVImport from '../components/CSVImport';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Maximize2, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  title: string;
  preview: string;
  content: string;
  status: 'Review' | 'Scheduled';
}

const DataSeed = () => {
  const [seed, setSeed] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get the current user's ID on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // If no user is found, show an error message
        toast({
          title: "Authentication Error",
          description: "You must be logged in to generate content",
          variant: "destructive",
        });
      }
    };

    fetchUser();
  }, [toast]);

  const handleGenerate = async () => {
    if (!seed.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic seed",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to generate content",
        variant: "destructive",
      });
      return;
    }
    
    setGenerating(true);
    
    try {
      const { data: generationData, error: generationError } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: seed,
          quantity,
        },
      });

      if (generationError) throw new Error(generationError.message || 'Failed to generate content');

      const newContentItems = generationData.map((item: any, index: number) => ({
        id: `content-${Date.now()}-${index}`,
        title: item.title,
        preview: item.preview,
        content: item.content,
        status: 'Review' as const,
      }));

      // Store content in the database
      for (const item of newContentItems) {
        const { error: dbError } = await supabase
          .from('content_ideas')
          .insert({
            title: item.title,
            content: item.content,
            status: item.status,
            user_id: userId, // Add the user_id field
          });

        if (dbError) {
          console.error('Database insertion error:', dbError);
          throw new Error('Failed to save content to database');
        }
      }

      // Update local state with new content
      setGeneratedContent(prevContent => [...prevContent, ...newContentItems]);

      toast({
        title: "Content Generated",
        description: `${quantity} new post ideas have been added and saved to the database.`,
      });
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to connect to AI service',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleStatus = (id: string) => {
    setGeneratedContent(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'Review' ? 'Scheduled' : 'Review' }
          : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setGeneratedContent(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Topic Deleted",
      description: "The selected topic has been removed.",
    });
  };

  const handleCsvData = (data: any[]) => {
    if (data && data.length > 0) {
      const contentFromCsv = data.map((row, index) => ({
        id: `csv-${Date.now()}-${index}`,
        title: row.title || row[0] || `Imported Topic ${index + 1}`,
        preview: row.preview || '',
        content: row.content || '',
        status: 'Review' as const,
      }));
      
      setGeneratedContent(contentFromCsv);
      toast({
        title: "CSV Imported",
        description: `${contentFromCsv.length} post ideas imported.`,
      });
    }
  };

  return (
    <div className="flex h-screen bg-writlix-lightgray">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Data Seed</h1>
            <p className="text-muted-foreground">Generate content ideas using AI</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Generate Content</CardTitle>
                <CardDescription>Enter a topic to generate LinkedIn post ideas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seed">Topic Seed</Label>
                  <Textarea 
                    id="seed"
                    placeholder="e.g., AI in healthcare, leadership strategies, remote work..."
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="quantity">Number of Ideas</Label>
                    <span className="text-sm text-muted-foreground">{quantity}</span>
                  </div>
                  <Slider 
                    id="quantity"
                    min={1} 
                    max={20} 
                    step={1}
                    value={[quantity]}
                    onValueChange={(value) => setQuantity(value[0])}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  onClick={handleGenerate} 
                  className="w-full"
                  disabled={generating || !seed.trim() || !userId}
                >
                  {generating ? 'Generating...' : 'Generate Ideas'}
                </Button>
                
                <CSVImport onCsvData={handleCsvData} />
              </CardFooter>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Generated Ideas</CardTitle>
                <CardDescription>Select ideas to save for scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent.length > 0 ? (
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
                      {generatedContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell className="relative">
                            <div className="line-clamp-2">{item.preview}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={() => setSelectedContent(item)}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className={item.status === 'Scheduled' ? 'text-green-600' : 'text-yellow-600'}
                              onClick={() => toggleStatus(item.id)}
                            >
                              {item.status}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-red-600"
                              onClick={() => handleDelete(item.id)}
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
                      {generating ? 'Generating ideas...' : 'No content ideas generated yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {generating ? 'Please wait...' : 'Enter a topic seed and click "Generate Ideas"'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        {selectedContent && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedContent.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 whitespace-pre-wrap">{selectedContent.content}</div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default DataSeed;
