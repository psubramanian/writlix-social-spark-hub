
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import CSVImport from '../CSVImport';

interface GenerationFormProps {
  onGenerate: (seed: string, quantity: number) => Promise<void>;
  onCsvImport: (data: any[]) => void;
  isGenerating: boolean;
}

const GenerationForm = ({ onGenerate, onCsvImport, isGenerating }: GenerationFormProps) => {
  const [seed, setSeed] = useState('');
  const [quantity, setQuantity] = useState(5);

  const handleSubmit = async () => {
    await onGenerate(seed, quantity);
  };

  return (
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
          onClick={handleSubmit} 
          className="w-full"
          disabled={isGenerating || !seed.trim()}
        >
          {isGenerating ? 'Generating...' : 'Generate Ideas'}
        </Button>
        
        <CSVImport onCsvData={onCsvImport} />
      </CardFooter>
    </Card>
  );
};

export default GenerationForm;
