
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 px-6 bg-black dark:bg-black">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Generate & Schedule Your LinkedIn Content with AI
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300">
              Create engaging LinkedIn posts with AI and schedule them automatically. Focus on growing your network while Writlix handles your content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')} 
                className="bg-primary hover:bg-primary/90 text-lg group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="text-lg border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                View Demo
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur-xl opacity-30"></div>
              <div className="relative bg-black dark:bg-black rounded-xl shadow-xl overflow-hidden border border-gray-800">
                <img 
                  src="/lovable-uploads/55c65d07-8f86-4ad3-aad6-e02f6df74db5.png" 
                  alt="Professional Content Creation Dashboard" 
                  className="w-full object-cover"
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
