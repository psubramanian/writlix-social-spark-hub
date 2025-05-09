
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionDebug } from '@/components/subscription/SubscriptionDebug';

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
    isRazorpayLoaded,
    formatSubscriptionStatus
  } = useSubscription();

  const daysLeft = getDaysLeft();
  const [searchParams] = useSearchParams();
  const fromPage = searchParams.get('from');
  const featureName = searchParams.get('feature');
  const [showRedirectAlert, setShowRedirectAlert] = useState(!!fromPage && !!featureName);

  // Auto-hide redirect alert after 10 seconds
  useEffect(() => {
    if (showRedirectAlert) {
      const timer = setTimeout(() => {
        setShowRedirectAlert(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showRedirectAlert]);

  // Check if this is likely a development or admin environment
  // In production, you'd want to limit this to admin users
  const isDevelopmentOrAdmin = () => {
    return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  };

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

      {showRedirectAlert && (
        <Alert className="mb-6 border-blue-400">
          <Lock className="h-4 w-4" />
          <AlertTitle>Premium Feature Required</AlertTitle>
          <AlertDescription>
            <p>
              <span className="font-medium">{featureName}</span> is a premium feature. 
              {isSubscriptionExpired 
                ? " Your subscription has expired." 
                : isTrialActive
                  ? ` Your trial will end in ${daysLeft} days.`
                  : " Subscribe to access this feature."}
            </p>
          </AlertDescription>
        </Alert>
      )}

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
            Your subscription has been canceled. You will have access until {subscription?.active_till ? new Date(subscription.active_till).toLocaleDateString() : 'the end of the current billing period'}.
          </AlertDescription>
        </Alert>
      )}

      {fromPage && featureName && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Data Seed</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate high-quality content ideas using AI tailored for professional social media posts.
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Instant Post</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and publish LinkedIn posts instantly with AI-assisted content generation from images.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
      
      {/* Show subscription debug information for development/admin users */}
      {isDevelopmentOrAdmin() && <SubscriptionDebug />}
    </div>
  );
};

export default Subscription;
