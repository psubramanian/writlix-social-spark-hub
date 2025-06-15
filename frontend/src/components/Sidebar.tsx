
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useClerk } from '@clerk/clerk-react'; // Changed to use Clerk's useClerk hook
import { BarChart, Settings, LogOut, FileText, Calendar, Send } from 'lucide-react';
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

  const menuItems = [
    { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Data Seed', path: '/data-seed' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Send, label: 'Instant Post', path: '/instant-post' },
    { icon: Settings, label: 'Settings', path: '/settings' },
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
