
import React from 'react';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2 } from "lucide-react";

const Subscription = () => {
  const { 
    subscription, 
    loading, 
    error, 
    handleUpgrade,
    cancelSubscription,
    getDaysLeft,
    isTrialActive,
    isSubscriptionActive,
    isSubscriptionExpired,
    isSubscriptionCanceled,
    isRazorpayLoaded
  } = useSubscription();

  const daysLeft = getDaysLeft();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription plan</p>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center items-center min-h-[400px]">
          <SubscriptionCard
            onUpgrade={handleUpgrade}
            isRazorpayLoaded={isRazorpayLoaded}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>

      {isTrialActive && daysLeft > 0 && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Trial Active</AlertTitle>
          <AlertDescription>
            You have {daysLeft} days left in your trial. Upgrade to PRO to keep access to all features.
          </AlertDescription>
        </Alert>
      )}
      
      {isSubscriptionExpired && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subscription Expired</AlertTitle>
          <AlertDescription>
            Your subscription has expired. Renew now to regain access to all premium features.
          </AlertDescription>
        </Alert>
      )}
      
      {isSubscriptionCanceled && (
        <Alert className="mb-6 border-amber-500">
          <Info className="h-4 w-4" />
          <AlertTitle>Subscription Canceled</AlertTitle>
          <AlertDescription>
            Your subscription has been canceled. You will have access until the end of the current billing period.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center items-center min-h-[400px]">
        <SubscriptionCard
          isCurrentPlan={isTrialActive || isSubscriptionActive || isSubscriptionExpired || isSubscriptionCanceled}
          onUpgrade={handleUpgrade}
          onCancel={cancelSubscription}
          trial={isTrialActive}
          daysLeft={daysLeft}
          status={subscription?.status}
          isRazorpayLoaded={isRazorpayLoaded}
        />
      </div>
    </div>
  );
};

export default Subscription;
