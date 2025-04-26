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
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const getSubscriptionStatus = () => {
    if (loading) {
      return (
        <div className="text-xs text-sidebar-foreground opacity-75 px-3 py-2">
          Loading subscription...
        </div>
      );
    }
    
    if (!subscription) {
      return (
        <div className="text-xs text-sidebar-foreground opacity-75 px-3 py-2">
          Starting 7-day trial...
        </div>
      );
    }
    
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.active_till);
      return (
        <div className="text-xs text-sidebar-foreground opacity-75 px-3 py-2">
          Trial ends {format(trialEnd, 'MMM dd, yyyy')}
        </div>
      );
    }
    
    if (subscription.status === 'active') {
      const renewalDate = new Date(subscription.active_till);
      return (
        <div className="text-xs text-sidebar-foreground opacity-75 px-3 py-2">
          PRO - Renews {format(renewalDate, 'MMM dd, yyyy')}
        </div>
      );
    }
    
    return (
      <div className="text-xs text-sidebar-foreground opacity-75 px-3 py-2">
        Subscription status: {subscription.status}
      </div>
    );
  };

  return (
    <aside className="min-h-screen w-64 bg-sidebar flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-writlix-blue rounded-md p-1">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-sidebar-foreground text-xl font-bold">Writlix</h1>
        </div>
        
        <nav className="space-y-1">
          <Link to="/dashboard" className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <BarChart size={18} />
            <span>Dashboard</span>
          </Link>
          
          <Link to="/data-seed" className={`sidebar-item ${isActive('/data-seed') ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Data Seed</span>
          </Link>
          
          <Link to="/schedule" className={`sidebar-item ${isActive('/schedule') ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Schedule</span>
          </Link>
          
          <Link to="/settings" className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          
          <Link to="/published" className={`sidebar-item ${isActive('/published') ? 'active' : ''}`}>
            <FileText size={18} />
            <span>Published</span>
          </Link>
          
          <Link
            to="/subscription"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${
              location.pathname === '/subscription' ? 'bg-gray-100 text-gray-900' : ''
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Subscription
          </Link>
        </nav>
      </div>
      
      <div className="mt-auto p-4">
        {getSubscriptionStatus()}
        <button 
          className="sidebar-item w-full justify-center text-sidebar-foreground mt-2"
          onClick={() => logout()}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
