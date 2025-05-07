
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
  featureName: string;
}

const SubscriptionProtectedRoute = ({ children, featureName }: SubscriptionProtectedRouteProps) => {
  const { 
    loading, 
    subscription,
    isTrialActive, 
    isSubscriptionActive,
    isSubscriptionExpired,
    isSubscriptionCanceled
  } = useSubscription();
  
  const location = useLocation();
  
  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    );
  }
  
  // Check if the subscription is canceled but still within the billing period
  const isWithinCanceledPeriod = isSubscriptionCanceled && subscription?.active_till 
    ? new Date(subscription.active_till) > new Date() 
    : false;
    
  // Add debug logging to help identify the issue
  console.log('Subscription status:', {
    isTrialActive,
    isSubscriptionActive,
    isSubscriptionCanceled,
    isWithinCanceledPeriod,
    active_till: subscription?.active_till,
    now: new Date().toISOString(),
    comparison: subscription?.active_till ? 
      new Date(subscription.active_till) > new Date() : 'No active_till date'
  });
    
  // User can access if they have an active trial, active subscription, or 
  // a canceled subscription that's still within the billing period
  const canAccess = isTrialActive || isSubscriptionActive || isWithinCanceledPeriod;
  
  // If user can't access, redirect to subscription page with feature info
  if (!canAccess) {
    return <Navigate 
      to={`/subscription?from=${location.pathname}&feature=${encodeURIComponent(featureName)}`} 
      replace 
    />;
  }
  
  // If user has access, show the protected content
  return <>{children}</>;
};

export default SubscriptionProtectedRoute;
