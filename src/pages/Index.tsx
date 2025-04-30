
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import { NewsletterPopup } from '../components/NewsletterPopup';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isNewsletterPopupOpen, setIsNewsletterPopupOpen] = useState(false);
  
  // Redirect authenticated users to dashboard after auth check is complete
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log("[INDEX] User is authenticated, redirecting to dashboard");
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Show newsletter popup after a delay if not seen before
  useEffect(() => {
    // Skip newsletter if user is authenticated or auth is still loading
    if (isLoading || isAuthenticated) {
      return;
    }
    
    // Check if the user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('newsletterPopupSeen');
    
    if (!hasSeenPopup) {
      // Open popup after 3 seconds
      const timer = setTimeout(() => {
        console.log("[INDEX] Showing newsletter popup");
        setIsNewsletterPopupOpen(true);
        sessionStorage.setItem('newsletterPopupSeen', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black dark:bg-black">
      <Header />
      <Hero />
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
