
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-writlix-blue rounded-md p-1">
              <span className="font-bold text-white text-2xl">W</span>
            </div>
            <h1 className="text-2xl font-bold">Writlix</h1>
          </div>
          
          <div>
            <Button variant="outline" className="mr-2" onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button onClick={() => navigate('/login')}>Get Started</Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 bg-writlix-lightblue bg-opacity-30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Generate & Schedule Your LinkedIn Content with AI
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Writlix helps you create engaging LinkedIn posts with AI and schedule them to post at the perfect time, so you can focus on what matters most.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/login')} className="bg-writlix-purple hover:bg-writlix-purple/90">
                  Start Creating Content
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                  Schedule a Demo
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="https://i.imgur.com/JgYmEww.png" 
                alt="Writlix Dashboard Preview" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Writlix?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines AI-powered content generation with smart scheduling to help you maintain a consistent LinkedIn presence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border rounded-xl hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-writlix-purple bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 11V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7C4 4.79086 5.79086 3 8 3H14" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 5L22 9" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M11 12H13" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 16H15" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Content Generation</h3>
              <p className="text-gray-600">
                Generate dozens of LinkedIn post ideas based on your topic seeds and business focus.
              </p>
            </div>
            
            <div className="p-6 border rounded-xl hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-writlix-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6C3 4.34315 4.34315 3 6 3H18C19.6569 3 21 4.34315 21 6V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6Z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 11V16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 8H8.01" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 16V11" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 16V13" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 8V10" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">
                Schedule your content to post at optimal times for maximum engagement and visibility.
              </p>
            </div>
            
            <div className="p-6 border rounded-xl hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-writlix-orange bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 10L11 14L9 12" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Publishing</h3>
              <p className="text-gray-600">
                Connect your LinkedIn account once and let Writlix handle the publishing process automatically.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-writlix-purple text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your LinkedIn Presence?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who use Writlix to create consistent, engaging LinkedIn content without the hassle.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/login')}
            className="bg-white text-writlix-purple hover:bg-gray-100"
          >
            Get Started for Free
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-writlix-blue rounded-md p-1">
                  <span className="font-bold text-white text-xl">W</span>
                </div>
                <h1 className="text-xl font-bold">Writlix</h1>
              </div>
              <p className="text-gray-600 max-w-xs">
                Your AI-powered LinkedIn content creation and scheduling assistant.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="#" className="hover:text-writlix-purple">Features</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Pricing</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Testimonials</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">FAQ</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="#" className="hover:text-writlix-purple">About</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Blog</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Careers</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="#" className="hover:text-writlix-purple">Privacy</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Terms</a></li>
                  <li><a href="#" className="hover:text-writlix-purple">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2025 Writlix. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-600 hover:text-writlix-purple">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-writlix-purple">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-writlix-purple">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
