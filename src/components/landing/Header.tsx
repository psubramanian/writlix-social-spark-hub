
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md p-1">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold">Writlix</h1>
        </div>
        
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Log In
          </Button>
          <Button onClick={() => navigate('/login')}>Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
