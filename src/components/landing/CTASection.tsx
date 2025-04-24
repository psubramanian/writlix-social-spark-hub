
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 px-6 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Transform Your LinkedIn Presence?</h2>
        <p className="text-xl mb-8 text-primary-foreground/90">
          Join thousands of professionals who use Writlix to create consistent, engaging LinkedIn content.
        </p>
        <Button 
          size="lg" 
          variant="secondary"
          onClick={() => navigate('/login')}
          className="bg-white text-primary hover:bg-white/90"
        >
          Get Started for Free
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
