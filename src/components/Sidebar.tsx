
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { format } from 'date-fns';
import { Calendar, BarChart, Settings, LogOut, FileText, CreditCard } from 'lucide-react';

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
    <div className="w-64 bg-sidebar h-full flex flex-col border-r">
      <div className="p-4 mb-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary rounded-md p-1">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-sidebar-foreground text-xl font-bold">Writlix</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                location.pathname === item.path
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <div className="text-xs text-sidebar-foreground/70 mb-2">
          {getSubscriptionStatus()}
        </div>
        <button 
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
