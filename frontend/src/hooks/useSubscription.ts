
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react'; // Changed to use Clerk's useUser hook
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isAfter } from 'date-fns';

interface SubscriptionData {
  id?: string;
  status: string;
  active_till: string;
  first_login_at: string | null;
  payment_provider?: string | null;
  payment_provider_subscription_id?: string | null;
  plan_id?: string | null;
}

export function useSubscription() {
  const { user, isLoaded: isUserLoaded } = useUser(); // Use Clerk's useUser hook, aliasing isLoaded to avoid conflict
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Check if Razorpay script is loaded
  useEffect(() => {
    if (window && (window as any).Razorpay) {
      setIsRazorpayLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setIsRazorpayLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        toast({
          title: "Payment Error",
          description: "Failed to load payment provider. Please try again later.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    }
    
    return () => {
      // Cleanup if component unmounts during loading
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!isUserLoaded || !user?.id) {
      // If user is not loaded yet, or no user, don't fetch. 
      // Set loading to false if it was true, or handle as appropriate.
      // This prevents errors if the hook runs before Clerk has loaded the user.
      if (loading) setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id as any)
        .maybeSingle();

      if (error) throw error;

      // Log data for debugging
      console.log("Subscription data from DB:", data);

      // Handle subscription expiration
      if (data && typeof data === 'object' && 'active_till' in data && 'status' in data) {
        const now = new Date();
        const expiryDate = new Date((data as any).active_till);
        
        // Check if subscription is expired
        if ((data as any).status !== 'trial' && isAfter(now, expiryDate)) {
          // Update subscription status to expired
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' } as any)
            .eq('id', (data as any).id);
            
          if (updateError) {
            console.error('Error updating expired subscription:', updateError);
          } else {
            // Update local state with expired status
            (data as any).status = 'expired';
          }
        }
      }

      setSubscription(data as SubscriptionData | null);
      // Log subscription state for debugging
      console.log("Final subscription state:", { 
        status: data && typeof data === 'object' && 'status' in data ? (data as any).status : null, 
        active_till: data && typeof data === 'object' && 'active_till' in data ? (data as any).active_till : null,
        isCanceled: data && typeof data === 'object' && 'status' in data ? (data as any).status === 'canceled' : false,
        // Add formatted dates for easier debugging
        active_till_formatted: data && typeof data === 'object' && 'active_till' in data && (data as any).active_till ? format(new Date((data as any).active_till), 'PPP HH:mm:ss') : null,
        now_formatted: format(new Date(), 'PPP HH:mm:ss')
      });
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch subscription details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, isUserLoaded]); // Add isUserLoaded to dependency array

  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user, fetchSubscription]);

  const formatSubscriptionStatus = () => {
    if (!subscription) return 'No active subscription';

    if (subscription.status === 'trial') {
      if (!subscription.active_till) return 'Trial active';
      
      const endDate = new Date(subscription.active_till);
      const now = new Date();
      
      if (endDate <= now) {
        return 'Trial expired';
      }
      
      const daysLeft = getDaysLeft();
      return `Trial ends ${format(endDate, 'MMM dd, yyyy')} (${daysLeft} days left)`;
    }

    if (subscription.status === 'active') {
      const renewalDate = new Date(subscription.active_till);
      return `PRO - Renews ${format(renewalDate, 'MMM dd, yyyy')}`;
    }

    if (subscription.status === 'expired') {
      return 'Subscription expired';
    }
    
    if (subscription.status === 'canceled' && subscription.active_till) {
      const endDate = new Date(subscription.active_till);
      return `Subscription status: canceled (Access until ${format(endDate, 'MMM dd, yyyy')})`;
    }

    return `Subscription status: ${subscription.status}`;
  };

  const getDaysLeft = () => {
    if (!subscription?.active_till) return 0;
    const diffTime = new Date(subscription.active_till).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      console.log("Payment successful:", paymentResponse);
      
      // Calculate subscription end date (30 days from now)
      const endDate = addDays(new Date(), 30).toISOString();
      
      // Update the subscription status in the database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          active_till: endDate,
          payment_provider: 'razorpay',
          payment_provider_subscription_id: paymentResponse.razorpay_order_id
        } as any)
        .eq('user_id', user?.id as any);
        
      if (updateError) {
        console.error("Error updating subscription:", updateError);
        throw updateError;
      }
      
      toast({
        title: "Subscription Activated",
        description: "Welcome to Writlix PRO! Your subscription is now active.",
      });
      
      await fetchSubscription();
    } catch (error: any) {
      console.error("Error processing payment success:", error);
      toast({
        title: "Error",
        description: "Failed to activate subscription. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You need to be logged in to upgrade.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if Razorpay script is loaded
      if (!isRazorpayLoaded) {
        toast({
          title: "Error",
          description: "Payment system is still loading. Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      // Create order in Razorpay
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { user_id: user?.id }
      });

      if (error) throw error;
      
      if (!data || !data.id) {
        throw new Error("Failed to create order. No data returned from server.");
      }

      console.log("Razorpay order created:", data);

      // Initialize Razorpay
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: "Writlix PRO",
        description: "Monthly PRO Subscription",
        order_id: data.id,
        handler: handlePaymentSuccess,
        prefill: {
          name: user.fullName || user.firstName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: "#6366f1" // Primary color from Tailwind
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user?.id || !subscription) {
      toast({
        title: "Error",
        description: "No active subscription found.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Log pre-cancellation state for debugging
      console.log('Pre-cancellation subscription state:', {
        id: subscription?.id,
        status: subscription?.status,
        active_till: subscription?.active_till,
        active_till_formatted: subscription?.active_till ? format(new Date(subscription.active_till), 'PPP HH:mm:ss') : null
      });
      
      // Update the subscription status in the database
      // IMPORTANT: We only update the status to 'canceled' but keep the active_till date unchanged
      const { data, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'canceled',
        } as any)
        .eq('user_id', user?.id as any)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Log post-cancellation response
      console.log('Post-cancellation database response:', data);
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You will have access until the end of the current billing period.",
      });
      
      // Fetch to ensure we have latest data
      await fetchSubscription();
      
      // Double-check the post-fetch state
      console.log('Final subscription state after cancellation:', { 
        status: subscription?.status, 
        active_till: subscription?.active_till,
        isAccessible: subscription?.active_till ? new Date(subscription?.active_till) > new Date() : false
      });
      
    } catch (error: any) {
      console.error("Cancellation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if the user is eligible for trial
  const isTrialEligible = !subscription || 
    (subscription.status === 'expired' && !subscription.payment_provider_subscription_id);

  // Check subscription status
  const isTrialActive = subscription?.status === 'trial' && getDaysLeft() > 0;
  const isSubscriptionActive = subscription?.status === 'active';
  const isSubscriptionExpired = subscription?.status === 'expired' || 
    (subscription?.status === 'trial' && getDaysLeft() === 0);
  const isSubscriptionCanceled = subscription?.status === 'canceled';

  // Add detailed debugging information
  console.log("Computed subscription states:", {
    isTrialActive,
    isSubscriptionActive,
    isSubscriptionExpired,
    isSubscriptionCanceled,
    status: subscription?.status,
    daysLeft: getDaysLeft(),
    active_till: subscription?.active_till,
    active_till_timestamp: subscription?.active_till ? new Date(subscription.active_till).getTime() : null,
    now_timestamp: new Date().getTime(),
    diff_ms: subscription?.active_till ? new Date(subscription.active_till).getTime() - new Date().getTime() : null,
    diff_days: subscription?.active_till ? Math.ceil((new Date(subscription.active_till).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
    access_allowed: isTrialActive || isSubscriptionActive || (isSubscriptionCanceled && subscription?.active_till && new Date(subscription.active_till) > new Date())
  });

  return {
    subscription,
    loading,
    error,
    handleUpgrade,
    cancelSubscription,
    getDaysLeft,
    fetchSubscription,
    formatSubscriptionStatus,
    isTrialActive,
    isSubscriptionActive,
    isSubscriptionExpired,
    isSubscriptionCanceled,
    isTrialEligible,
    isRazorpayLoaded
  };
}
