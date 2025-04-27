
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SubscriptionData {
  status: string;
  active_till: string;
  first_login_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      // Reset subscription when user logs out
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching subscription for user: ${user.id}`);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error);
        setError(error.message);
        throw error;
      }
      
      console.log('Subscription data:', data);
      
      // If no subscription found, create a trial subscription
      if (!data) {
        console.log('No subscription found, creating trial subscription');
        await createTrialSubscription(user.id);
      } else {
        setSubscription(data);
      }
    } catch (error: any) {
      console.error('Error in subscription process:', error);
      // Don't show error toast to users, just log it
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTrialSubscription = async (userId: string) => {
    try {
      console.log('Creating trial subscription for user:', userId);
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          status: 'trial',
          active_till: trialEndDate.toISOString(),
          first_login_at: new Date().toISOString()
        })
        .select('*')
        .maybeSingle(); // Use maybeSingle() here too
      
      if (error) {
        console.error('Error creating trial subscription:', error);
        throw error;
      }
      
      console.log('Trial subscription created:', data);
      setSubscription(data);
    } catch (error: any) {
      console.error('Error creating trial subscription:', error);
      setError(error.message);
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
      if (!(window as any).Razorpay) {
        toast({
          title: "Error",
          description: "Razorpay script not loaded. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

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
        currency: data.currency,
        name: "Writlix PRO",
        description: "Monthly PRO Subscription",
        order_id: data.id,
        handler: async (response: any) => {
          console.log("Payment successful:", response);
          
          // Update the subscription status in the database
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ 
              status: 'active',
              active_till: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              payment_provider: 'razorpay',
              payment_provider_subscription_id: response.razorpay_order_id
            })
            .eq('user_id', user?.id);
            
          if (updateError) {
            console.error("Error updating subscription:", updateError);
            throw updateError;
          }
          
          toast({
            title: "Subscription Activated",
            description: "Welcome to Writlix PRO! Your subscription is now active.",
          });
          
          await fetchSubscription();
        },
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
    }
  };

  const getDaysLeft = () => {
    if (!subscription?.active_till) return 0;
    const diffTime = new Date(subscription.active_till).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    subscription,
    loading,
    error,
    handleUpgrade,
    getDaysLeft,
    fetchSubscription,
  };
}
