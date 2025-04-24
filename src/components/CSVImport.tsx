
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface CSVImportProps {
  onCsvData: (data: any[]) => void;
}

const CSVImport: React.FC<CSVImportProps> = ({ onCsvData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (csvData) {
        const parsedData = parseCSV(csvData);
        onCsvData(parsedData);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was an error reading the CSV file",
        variant: "destructive",
      });
    };
    
    reader.readAsText(file);
    
    // Reset the file input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const parseCSV = (csvString: string) => {
    const lines = csvString.split('\n');
    const result = [];
    
    // Skip empty lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',');
        result.push(values);
      }
    }
    
    // Check if there's a header row and create objects
    if (result.length > 0) {
      const headers = result[0];
      const data = [];
      
      for (let i = 1; i < result.length; i++) {
        const obj: any = {};
        const currentLine = result[i];
        
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentLine[j];
        }
        
        data.push(obj);
      }
      
      return data;
    }
    
    return result;
  };
  
  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv"
        className="hidden"
      />
      <Button 
        variant="outline" 
        onClick={handleClick}
        className="w-full"
      >
        Import from CSV
      </Button>
    </>
  );
};

export default CSVImport;
