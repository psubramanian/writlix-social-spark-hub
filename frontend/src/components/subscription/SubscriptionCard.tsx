
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";
import { Badge } from "@/components/ui/badge";

interface SubscriptionCardProps {
  isCurrentPlan?: boolean;
  onUpgrade?: () => void;
  onCancel?: () => void;
  trial?: boolean;
  daysLeft?: number;
  status?: string;
  isRazorpayLoaded?: boolean;
}

export const SubscriptionCard = ({ 
  isCurrentPlan, 
  onUpgrade, 
  onCancel, 
  trial, 
  daysLeft, 
  status,
  isRazorpayLoaded = true
}: SubscriptionCardProps) => {
  const { data: plan, isLoading, error } = useSubscriptionPlan('PRO Plan');
  
  const features = [
    "Unlimited LinkedIn posts",
    "Schedule posts in advance",
    "AI-powered content generation",
    "Analytics dashboard",
    "Priority support"
  ];

  if (isLoading) {
    return (
      <Card className="w-[300px]">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !plan) {
    return (
      <Card className="w-[300px]">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center min-h-[300px] text-center text-muted-foreground">
            Unable to load plan details
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle different subscription statuses
  let statusBadge = null;
  let actionButton = null;

  if (isCurrentPlan && trial && daysLeft && daysLeft > 0) {
    // Trial active
    statusBadge = <Badge variant="outline" className="mb-2">Trial - {daysLeft} days left</Badge>;
    actionButton = (
      <Button 
        className="w-full" 
        onClick={onUpgrade}
        disabled={!isRazorpayLoaded}
      >
        {!isRazorpayLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Upgrade Now'
        )}
      </Button>
    );
  } else if (isCurrentPlan && status === 'active') {
    // Active subscription
    statusBadge = <Badge className="mb-2 bg-green-500 hover:bg-green-600">Active</Badge>;
    actionButton = (
      <Button 
        className="w-full" 
        variant="outline"
        onClick={onCancel}
      >
        Cancel Subscription
      </Button>
    );
  } else if (status === 'expired' || (trial && daysLeft === 0)) {
    // Expired subscription
    statusBadge = <Badge variant="destructive" className="mb-2">Expired</Badge>;
    actionButton = (
      <Button 
        className="w-full" 
        onClick={onUpgrade}
        disabled={!isRazorpayLoaded}
      >
        {!isRazorpayLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Renew Subscription'
        )}
      </Button>
    );
  } else if (status === 'canceled') {
    // Canceled subscription
    statusBadge = <Badge variant="outline" className="mb-2 bg-amber-500 hover:bg-amber-600 text-white">Canceled</Badge>;
    actionButton = (
      <Button 
        className="w-full" 
        onClick={onUpgrade}
        disabled={!isRazorpayLoaded}
      >
        {!isRazorpayLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Resubscribe'
        )}
      </Button>
    );
  } else {
    // Default state for new users
    actionButton = (
      <Button 
        className="w-full" 
        onClick={onUpgrade}
        disabled={!isRazorpayLoaded}
      >
        {!isRazorpayLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Upgrade Now'
        )}
      </Button>
    );
  }

  return (
    <Card className={`w-[300px] ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{plan.name}</CardTitle>
          {statusBadge}
        </div>
        <CardDescription>
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-center mb-4">
          <span className="text-3xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground ml-1">/month</span>
        </div>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {actionButton}
      </CardFooter>
    </Card>
  );
};
