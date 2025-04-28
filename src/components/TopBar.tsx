
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Menu } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSidebar } from '@/components/ui/sidebar';

const TopBar = () => {
  const { user } = useAuth();
  const { subscription, loading, formatSubscriptionStatus } = useSubscription();
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-xl font-semibold">Welcome, {user?.name || 'User'}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="rounded-full h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user?.name || 'Guest'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading subscription...' : formatSubscriptionStatus()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
