
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
