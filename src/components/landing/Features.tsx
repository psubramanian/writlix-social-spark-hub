
import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-2xl bg-gray-900 dark:bg-gray-900 hover:shadow-lg transition-all duration-200 border border-gray-800 group hover:border-primary/20">
    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors dark:bg-primary/20">
      {icon}
    </div>
    <h3 className="text-2xl font-semibold mb-3 text-white">{title}</h3>
    <p className="text-gray-400 dark:text-gray-400 text-lg">{description}</p>
  </div>
);

const Features = () => {
  return (
    <section className="py-32 px-6 bg-black dark:bg-black">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Why Choose Writlix?
          </h2>
          <p className="text-xl text-gray-400 dark:text-gray-400 max-w-2xl mx-auto">
            Our platform combines AI-powered content generation with smart scheduling for a consistent LinkedIn presence.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="AI Content Generation"
            description="Generate engaging LinkedIn posts with our advanced AI technology in seconds."
          />
          
          <FeatureCard
            icon={
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Smart Scheduling"
            description="Schedule your content to post at optimal times for maximum engagement."
          />
          
          <FeatureCard
            icon={
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Analytics & Insights"
            description="Track your content performance and optimize your strategy with detailed analytics."
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
