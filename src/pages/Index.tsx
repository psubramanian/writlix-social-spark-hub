
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import { NewsletterPopup } from '../components/NewsletterPopup';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isNewsletterPopupOpen, setIsNewsletterPopupOpen] = useState(false);
  
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  useEffect(() => {
    // Check if the user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('newsletterPopupSeen');
    
    if (!hasSeenPopup) {
      // Open popup after 3 seconds
      const timer = setTimeout(() => {
        setIsNewsletterPopupOpen(true);
        sessionStorage.setItem('newsletterPopupSeen', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to create engaging LinkedIn content?</h2>
        <p className="mb-6">Log in to access the Instant Post feature and all other tools</p>
        <Button size="lg" onClick={handleGetStarted}>
          {isAuthenticated ? 'Go to Dashboard' : 'Login or Sign Up'}
        </Button>
      </div>
      <Features />
      <CTASection />
      <Footer />
      <NewsletterPopup 
        isOpen={isNewsletterPopupOpen} 
        onClose={() => setIsNewsletterPopupOpen(false)} 
      />
    </div>
  );
};

export default Index;
