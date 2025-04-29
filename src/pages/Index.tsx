
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
  
  return (
    <div className="min-h-screen bg-white">
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
