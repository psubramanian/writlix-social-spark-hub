
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function SubscriptionDebug() {
  const {
    subscription,
    isTrialActive,
    isSubscriptionActive,
    isSubscriptionExpired,
    isSubscriptionCanceled,
    getDaysLeft,
    formatSubscriptionStatus
  } = useSubscription();

  if (!subscription) {
    return null;
  }

  const now = new Date();
  const activeTill = subscription.active_till ? new Date(subscription.active_till) : null;
  const isWithinCanceledPeriod = isSubscriptionCanceled && activeTill 
    ? activeTill > now 
    : false;
  
  const daysLeft = getDaysLeft();
  const formattedStatus = formatSubscriptionStatus();

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          Subscription Debug
          <Badge variant="outline" className="ml-2 text-xs">
            {subscription.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Status:</div>
          <div>{subscription.status}</div>
          
          <div className="font-medium">Formatted Status:</div>
          <div>{formattedStatus}</div>
          
          <div className="font-medium">Active Till:</div>
          <div>
            {activeTill ? format(activeTill, 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
          </div>
          
          <div className="font-medium">Current Time:</div>
          <div>{format(now, 'yyyy-MM-dd HH:mm:ss')}</div>
          
          <div className="font-medium">Days Left:</div>
          <div>{daysLeft}</div>
          
          <div className="font-medium">Access States:</div>
          <div className="space-x-2">
            <Badge variant={isTrialActive ? "default" : "outline"} className="text-xs">
              Trial: {isTrialActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={isSubscriptionActive ? "default" : "outline"} className="text-xs">
              Sub: {isSubscriptionActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={isSubscriptionCanceled ? "destructive" : "outline"} className="text-xs">
              Canceled: {isSubscriptionCanceled ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="font-medium">Within Canceled Period:</div>
          <div>{isWithinCanceledPeriod ? 'Yes' : 'No'}</div>
          
          <div className="font-medium">Should Have Access:</div>
          <div>{isTrialActive || isSubscriptionActive || isWithinCanceledPeriod ? 'Yes' : 'No'}</div>
        </div>
      </CardContent>
    </Card>
  );
}
