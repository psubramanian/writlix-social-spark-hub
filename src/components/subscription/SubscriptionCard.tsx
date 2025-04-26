
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SubscriptionCardProps {
  isCurrentPlan?: boolean;
  onUpgrade?: () => void;
  trial?: boolean;
  daysLeft?: number;
}

export const SubscriptionCard = ({ isCurrentPlan, onUpgrade, trial, daysLeft }: SubscriptionCardProps) => {
  const features = [
    "Unlimited LinkedIn posts",
    "Schedule posts in advance",
    "AI-powered content generation",
    "Analytics dashboard",
    "Priority support"
  ];

  return (
    <Card className={`w-[300px] ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <CardTitle>PRO Plan</CardTitle>
        <CardDescription>
          {trial 
            ? `${daysLeft} days left in trial`
            : 'Full access to all features'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-center mb-4">
          <span className="text-3xl font-bold">$29.99</span>
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
        {!isCurrentPlan && (
          <Button 
            className="w-full" 
            onClick={onUpgrade}
          >
            Upgrade Now
          </Button>
        )}
        {isCurrentPlan && (
          <Button className="w-full" disabled>
            Current Plan
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
