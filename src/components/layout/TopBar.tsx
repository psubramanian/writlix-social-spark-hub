"use client";

import React from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Bell, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const TopBar = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toggleSidebar } = useSidebar();

  if (!isUserLoaded) {
    return (
      <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.firstName || 'User';
  
  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Welcome back, {displayName}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Here's your content overview</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10 border-2 border-purple-200 dark:border-purple-800",
                userButtonPopoverCard: "shadow-xl border border-slate-200 dark:border-slate-700",
                userButtonPopoverActionButton: "hover:bg-slate-100 dark:hover:bg-slate-800"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TopBar;