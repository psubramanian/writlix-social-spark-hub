
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bell } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const TopBar = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  const getSubscriptionBadge = () => {
    if (!subscription) {
      // Default message for users without subscription data
      return (
        <p className="text-xs text-muted-foreground mt-1">
          Trial status unavailable
        </p>
      );
    }
    
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.active_till);
      return (
        <p className="text-xs text-muted-foreground mt-1">
          Trial ends {format(trialEnd, 'MMM dd, yyyy')}
        </p>
      );
    }
    
    if (subscription.status === 'active') {
      const renewalDate = new Date(subscription.active_till);
      return (
        <p className="text-xs text-muted-foreground mt-1">
          PRO - Renews {format(renewalDate, 'MMM dd, yyyy')}
        </p>
      );
    }
    
    // Fallback for any other status
    return (
      <p className="text-xs text-muted-foreground mt-1">
        Subscription status: {subscription.status}
      </p>
    );
  };
  
  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div>
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
            {getSubscriptionBadge()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
