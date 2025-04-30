
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="border-b border-gray-800 bg-black/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-2">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Writlix
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            onClick={() => navigate('/login')}
            className="text-lg text-gray-300 hover:bg-gray-800"
          >
            Log In
          </Button>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-primary hover:bg-primary/90 text-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
