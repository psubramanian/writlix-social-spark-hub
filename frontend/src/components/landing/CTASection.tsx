
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-32 px-6 bg-gradient-to-b from-black to-gray-900 dark:from-black dark:to-gray-900">
      <div className="container mx-auto max-w-4xl text-center space-y-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Ready to Transform Your LinkedIn Presence?
        </h2>
        <p className="text-xl text-gray-400 dark:text-gray-400 max-w-2xl mx-auto">
          Join thousands of professionals who use Writlix to create consistent, engaging LinkedIn content.
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate('/login')}
          className="bg-primary hover:bg-primary/90 text-lg group"
        >
          Get Started Free
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
