
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Generate & Schedule Your LinkedIn Content with AI
            </h1>
            <p className="text-xl text-muted-foreground">
              Create engaging LinkedIn posts with AI and schedule them automatically. Focus on growing your network while Writlix handles your content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90">
                Start Creating Content
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                View Demo
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur-xl opacity-30"></div>
              <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border">
                <img 
                  src="https://i.imgur.com/JgYmEww.png" 
                  alt="Writlix Dashboard Preview" 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
