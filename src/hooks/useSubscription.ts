
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

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      // Create subscription in Razorpay
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { user_id: user?.id }
      });

      if (error) throw error;

      // Initialize Razorpay
      const options = {
        key: "rzp_test_YOUR_KEY_HERE", // Replace with your key in production
        subscription_id: data.id,
        name: "Writlix PRO",
        description: "Monthly PRO Subscription",
        handler: async (response: any) => {
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
      toast({
        title: "Error",
        description: error.message,
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
    handleUpgrade,
    getDaysLeft,
  };
}
