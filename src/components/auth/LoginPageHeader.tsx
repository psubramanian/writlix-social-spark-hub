"use client";

import React from 'react';

export const LoginPageHeader = () => {
  return (
    <div className="text-center">
      {/* Adjusted text colors for dark background */}
      <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
        <span className="text-purple-300">W</span>ritlix
      </h1>
    </div>
  );
};

export default LoginPageHeader; // Added default export for easier import in Next.js pages
