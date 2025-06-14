
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useClerk } from '@clerk/clerk-react'; // Changed to use Clerk's useClerk hook
import { useSubscription } from '../hooks/useSubscription';
import { BarChart, Settings, LogOut, FileText, Calendar, CreditCard, Send, Lock } from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useClerk(); // Use Clerk's signOut function
  // const { user } = useUser(); // We might need user.id for useSubscription later
  const { 
    subscription, 
    loading, 
    formatSubscriptionStatus,
    isTrialActive,
    isSubscriptionActive,
    isSubscriptionCanceled
  } = useSubscription();
  
  // A user has access if they have an active trial, active subscription, or canceled subscription that hasn't expired
  // const hasActiveSubscription = isTrialActive || isSubscriptionActive || 
  //   (isSubscriptionCanceled && subscription?.active_till && new Date(subscription.active_till) > new Date());
  // This variable is no longer needed for sidebar item gating.

  const menuItems = [
    { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Data Seed', path: '/data-seed' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Send, label: 'Instant Post', path: '/instant-post' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  ];
  
  return (
    <ShadcnSidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md p-1">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-sidebar-foreground text-xl font-bold">Writlix</h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              {/* Tooltip for item.label is handled by SidebarMenuButton's tooltip prop */}
              <div className="w-full">
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                  tooltip={item.label}
                >
                  <Link to={item.path} className="flex items-center w-full">
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="text-xs text-sidebar-foreground/70 mb-2">
          {loading ? "Loading subscription..." : formatSubscriptionStatus()}
        </div>
        <SidebarMenuButton
          onClick={() => signOut({ redirectUrl: '/login' })}
          className="w-full"
        >
          <LogOut />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;
