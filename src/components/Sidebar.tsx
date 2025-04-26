import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { format } from 'date-fns';
import { Calendar, BarChart, Settings, LogOut, FileText, CreditCard, PanelLeft, Menu } from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const SidebarWrapper = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { subscription, loading } = useSubscription();
  const { state } = useSidebar();
  
  const menuItems = [
    { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Data Seed', path: '/data-seed' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  ];
  
  const getSubscriptionStatus = () => {
    if (loading) return "Loading subscription...";
    if (!subscription) return "Starting 7-day trial...";
    if (subscription.status === 'trial') {
      return `Trial ends ${format(new Date(subscription.active_till), 'MMM dd, yyyy')}`;
    }
    if (subscription.status === 'active') {
      return `PRO - Renews ${format(new Date(subscription.active_till), 'MMM dd, yyyy')}`;
    }
    return `Subscription status: ${subscription.status}`;
  };

  return (
    <ShadcnSidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary rounded-md p-1">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-sidebar-foreground text-xl font-bold">Writlix</h1>
        </div>
        <SidebarTrigger className="absolute right-2 top-3" />
      </SidebarHeader>
      
      {state === "collapsed" && (
        <button 
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-sidebar hover:bg-sidebar-accent p-2 rounded-r-md transition-colors"
          onClick={() => document.querySelector('[data-sidebar="trigger"]')?.click()}
        >
          <Menu className="w-5 h-5 text-sidebar-foreground" />
        </button>
      )}
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.path}
                tooltip={item.label}
              >
                <Link to={item.path}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/70 mb-2">
          {getSubscriptionStatus()}
        </div>
        <button 
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};

const SidebarWithProvider = () => (
  <SidebarProvider defaultOpen={true}>
    <SidebarWrapper />
  </SidebarProvider>
);

export default SidebarWithProvider;
