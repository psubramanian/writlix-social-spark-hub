
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];

export function useSubscriptionPlan(planName: string) {
  return useQuery({
    queryKey: ['subscription-plan', planName],
    queryFn: async (): Promise<SubscriptionPlan> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching subscription plan:', error);
        throw error;
      }
      
      if (!data) {
        console.error(`Plan ${planName} not found`);
        throw new Error(`Plan ${planName} not found`);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}
