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
      <div className="h-16 border-b border-purple-200/50 bg-gradient-to-r from-white via-purple-50 to-blue-50 backdrop-blur-sm shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.firstName || 'User';
  
  return (
    <div className="h-16 border-b border-purple-200/50 bg-gradient-to-r from-white via-purple-50 to-blue-50 backdrop-blur-sm shadow-lg flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 rounded-xl transition-all duration-300 hover:shadow-md"
        >
          <Menu className="h-5 w-5 text-slate-600 hover:text-slate-800 transition-colors" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-black via-slate-800 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {displayName}!
          </h1>
          <p className="text-sm text-slate-700 font-medium">Here's your content overview</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full h-10 w-10 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 transition-all duration-300 hover:shadow-md"
        >
          <Bell className="h-5 w-5 text-slate-600 hover:text-slate-800 transition-colors" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <div className="pl-3 border-l border-purple-200/50">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-11 h-11 border-2 border-purple-400 shadow-lg ring-2 ring-purple-200/50 hover:ring-purple-300/70 transition-all duration-300 hover:scale-105",
                userButtonPopoverCard: "shadow-2xl border border-purple-200/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-md rounded-xl",
                userButtonPopoverHeader: "bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-xl p-4",
                userButtonPopoverMain: "p-0",
                userButtonPopoverFooter: "border-t border-purple-200/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-b-xl p-3",
                userButtonPopoverActionButton: "hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 text-slate-700 hover:text-slate-800 transition-all duration-300 rounded-lg m-1 font-medium hover:shadow-md",
                userButtonPopoverActionButtonText: "text-slate-700 font-medium",
                userButtonPopoverActionButtonIcon: "text-purple-600",
                userPreviewMainIdentifier: "text-slate-800 font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent",
                userPreviewSecondaryIdentifier: "text-slate-600"
              }
            }}
            userProfileMode="modal"
            userProfileProps={{
              appearance: {
                elements: {
                  // Main modal styling
                  modalContent: "bg-gradient-to-br from-purple-50 via-white to-blue-50 backdrop-blur-xl",
                  modalCloseButton: "text-slate-600 hover:text-slate-800 hover:bg-purple-100 rounded-lg transition-all",
                  
                  // Card container
                  card: "shadow-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-blue-50/30 rounded-2xl overflow-hidden",
                  
                  // Header section
                  header: "bg-gradient-to-r from-black via-slate-800 to-purple-600 text-white p-8 relative overflow-hidden",
                  headerTitle: "text-white text-2xl font-bold drop-shadow-lg",
                  headerSubtitle: "text-slate-200 text-sm",
                  
                  // Navigation tabs
                  navbar: "bg-gradient-to-r from-slate-100 to-purple-100/50 border-b border-slate-200/50 px-6",
                  navbarButton: "text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-slate-200/60 hover:to-purple-200/60 font-medium py-3 px-4 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-black data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg",
                  
                  // Main content area
                  main: "p-8 bg-gradient-to-b from-white to-purple-50/20",
                  
                  // Profile section
                  profileSection: "mb-8",
                  profileSectionTitle: "text-slate-800 text-lg font-semibold mb-4 bg-gradient-to-r from-black via-slate-700 to-purple-600 bg-clip-text text-transparent",
                  
                  // Avatar section
                  avatarBox: "w-20 h-20 border-4 border-purple-300 shadow-xl ring-4 ring-purple-200/50 mb-4",
                  avatarImagePlaceholder: "bg-gradient-to-br from-purple-400 to-blue-500 text-white text-2xl font-bold",
                  
                  // Form elements
                  formFieldRow: "mb-6",
                  formFieldLabel: "text-slate-700 font-semibold text-sm mb-2 block",
                  formFieldInput: "w-full p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 bg-white/80 text-slate-800",
                  formFieldInputShowPasswordButton: "text-purple-600 hover:text-purple-700",
                  
                  // Buttons
                  formButtonPrimary: "bg-gradient-to-r from-black via-slate-800 to-purple-600 hover:from-slate-900 hover:via-slate-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105",
                  formButtonSecondary: "bg-gradient-to-r from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 text-slate-800 font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-slate-400",
                  
                  // Alert messages
                  alert: "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4",
                  alertText: "text-red-700 font-medium",
                  
                  // Success messages
                  formFieldSuccessText: "text-green-600 font-medium text-sm mt-1",
                  
                  // Error messages
                  formFieldErrorText: "text-red-600 font-medium text-sm mt-1",
                  formFieldHintText: "text-slate-500 text-sm mt-1",
                  
                  // Footer
                  footer: "border-t border-purple-200/30 bg-gradient-to-r from-purple-50/30 to-blue-50/30 p-6",
                  footerActionText: "text-slate-600",
                  footerActionLink: "text-purple-600 hover:text-purple-700 font-medium",
                  
                  // File upload
                  fileDropAreaBox: "border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 transition-all bg-gradient-to-br from-purple-50/30 to-blue-50/30",
                  fileDropAreaButtonPrimary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:shadow-lg transition-all",
                  
                  // Loading states
                  spinner: "text-purple-600",
                  
                  // Badge/Tag elements
                  badge: "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium",
                  
                  // Dividers
                  dividerLine: "bg-gradient-to-r from-purple-200/50 to-blue-200/50",
                  dividerText: "text-slate-500 font-medium"
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TopBar;