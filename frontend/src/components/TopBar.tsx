
import React from 'react';
import { useUser, UserButton } from '@clerk/clerk-react'; // Changed to use Clerk's useUser hook, Added UserButton // Changed to use Clerk's useUser hook
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Menu } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';

const TopBar = () => {
  const { user, isLoaded: isUserLoaded } = useUser(); // Use Clerk's useUser hook
  // const { subscription, loading, formatSubscriptionStatus } = useSubscription(); // This line is already present
  // const { toggleSidebar } = useSidebar(); // This line is already present

  if (!isUserLoaded) {
    // You might want a more sophisticated loading state, or just render minimal UI
    return (
      <div className="h-16 border-b bg-white dark:bg-background-dark dark:border-border-dark flex items-center justify-between px-6">
        <div>Loading...</div>
      </div>
    );
  }

  // Construct a display name, Clerk provides firstName, lastName, fullName
  const displayName = user?.fullName || user?.firstName || 'User';
  const avatarFallback = displayName?.charAt(0)?.toUpperCase() || 'U';
  const emailAddress = user?.primaryEmailAddress?.emailAddress || '';
  const { subscription, loading, formatSubscriptionStatus } = useSubscription();
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="h-16 border-b bg-white dark:bg-background-dark dark:border-border-dark flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="dark:text-foreground-dark">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-xl font-semibold dark:text-foreground-dark">Welcome, {displayName}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <Button variant="ghost" size="sm" className="rounded-full h-9 w-9 p-0 dark:text-foreground-dark">
          <Bell className="h-5 w-5" />
        </Button>
        
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
};

export default TopBar;
