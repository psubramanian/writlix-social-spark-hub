import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import CSVImport from '../components/CSVImport';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  status: 'Review' | 'Scheduled';
}

const DataSeed = () => {
  const [seed, setSeed] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const { toast } = useToast();
  
  const handleGenerate = () => {
    if (!seed.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic seed",
        variant: "destructive",
      });
      return;
    }
    
    setGenerating(true);
    setTimeout(() => {
      const mockResults = Array.from({ length: quantity }).map((_, index) => ({
        id: `content-${Date.now()}-${index}`,
        title: getMockTitle(seed, index),
        status: 'Review' as const,
      }));
      
      setGeneratedContent(mockResults);
      setGenerating(false);
      
      toast({
        title: "Content Generated",
        description: `${quantity} post ideas have been generated.`,
      });
    }, 1500);
  };
  
  const getMockTitle = (seed: string, index: number) => {
    const titles = [
      `10 Ways ${seed} Can Transform Your Business in 2025`,
      `The Future of ${seed}: Trends to Watch`,
      `How ${seed} is Disrupting Traditional Industries`,
      `${seed} Best Practices: A Comprehensive Guide`,
      `Why Every Professional Should Understand ${seed}`,
      `${seed} Case Study: Success Stories from Industry Leaders`,
      `The Hidden Opportunities in ${seed} That Most People Miss`,
      `${seed} vs Traditional Approaches: A Comparative Analysis`,
      `Implementing ${seed} in Your Organization: Step-by-Step Guide`,
      `The ROI of ${seed}: Measuring Business Impact`,
      `${seed} Mistakes to Avoid: Lessons Learned`,
      `How to Become a ${seed} Expert in Just 30 Days`,
      `${seed} Tools and Resources Every Professional Should Know`,
      `The Psychology Behind Successful ${seed} Strategies`,
      `${seed} Myths Debunked: Separating Fact from Fiction`,
    ];
    
    return titles[index % titles.length];
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
                  disabled={generating || !seed.trim()}
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
                        <TableHead>Topic</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
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
    </div>
  );
};

export default DataSeed;
