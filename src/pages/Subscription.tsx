
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Subscription = () => {
  const { subscription, loading, handleUpgrade, getDaysLeft } = useSubscription();

  const isTrialActive = subscription?.status === 'trial';
  const isPro = subscription?.status === 'active';
  const daysLeft = getDaysLeft();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
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
        </main>
      </div>
    </div>
  );
};

export default Subscription;
