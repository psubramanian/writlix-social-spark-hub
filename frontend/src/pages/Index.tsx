
import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react'; // Using Clerk's useAuth for session state and useUser for user data
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import { NewsletterPopup } from '../components/NewsletterPopup';

const Index = () => {
  const { isLoaded, isSignedIn, userId } = useAuth(); // Clerk's useAuth hook
  const { user } = useUser(); // Clerk's useUser for more detailed user info if needed, though not directly used here yet.
  const isAuthenticated = isSignedIn; // Map Clerk's isSignedIn to isAuthenticated
  const isLoading = !isLoaded; // Map Clerk's !isLoaded to isLoading
  const navigate = useNavigate();
  const [isNewsletterPopupOpen, setIsNewsletterPopupOpen] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // Start loading the content immediately but defer rendering for a smoother experience
  useEffect(() => {
    if (!isLoading) {
      // Load content right away if auth is already determined
      setContentLoaded(true);
    } else {
      // Small delay for better loading appearance
      const timer = setTimeout(() => {
        setContentLoaded(true);
      }, 50); // Reduced from 100ms to 50ms for faster loading
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
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
  if (isLoading || !isLoaded) { // Ensure both Clerk's isLoaded and our derived isLoading are checked
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
      {/* Always render Header for faster perceived loading */}
      <Header />
      
      {/* Conditionally render the rest of the content */}
      {contentLoaded && (
        <>
          <Hero />
          <Features />
          <CTASection />
          <Footer />
        </>
      )}
      
      <NewsletterPopup 
        isOpen={isNewsletterPopupOpen} 
        onClose={() => setIsNewsletterPopupOpen(false)} 
      />
    </div>
  );
};

export default Index;
