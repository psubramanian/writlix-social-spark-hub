
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { format } from 'date-fns';
import { BarChart, Settings, LogOut, FileText, Calendar, CreditCard } from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { subscription, loading } = useSubscription();
  
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
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.path}
                tooltip={item.label}
              >
                <Link to={item.path}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="text-xs text-sidebar-foreground/70 mb-2">
          {getSubscriptionStatus()}
        </div>
        <SidebarMenuButton
          onClick={() => logout()}
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
