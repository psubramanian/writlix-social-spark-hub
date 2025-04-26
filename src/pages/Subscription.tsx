
import React from 'react';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2 } from "lucide-react";

const Subscription = () => {
  const { subscription, loading, error, handleUpgrade, getDaysLeft } = useSubscription();

  const isTrialActive = subscription?.status === 'trial';
  const isPro = subscription?.status === 'active';
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
            isCurrentPlan={false}
            onUpgrade={handleUpgrade}
            trial={false}
            daysLeft={0}
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

      <div className="flex justify-center items-center min-h-[400px]">
        <SubscriptionCard
          isCurrentPlan={isPro}
          onUpgrade={handleUpgrade}
          trial={isTrialActive}
          daysLeft={daysLeft}
        />
      </div>
    </div>
  );
};

export default Subscription;
