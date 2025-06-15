"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from '@clerk/nextjs';
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

const Sidebar = () => {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const menuItems = [
    { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Data Seed', path: '/data-seed' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Send, label: 'Instant Post', path: '/instant-post' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];
  
  return (
    <ShadcnSidebar className="border-r border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <SidebarHeader className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-2 shadow-lg">
            <span className="font-bold text-white text-2xl">W</span>
          </div>
          <h1 className="text-slate-800 dark:text-slate-100 text-xl font-bold">Writlix</h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.path}
                tooltip={item.label}
                className="w-full mb-1 hover:bg-slate-100 dark:hover:bg-slate-800 data-[active=true]:bg-purple-100 dark:data-[active=true]:bg-purple-900/50 data-[active=true]:text-purple-700 dark:data-[active=true]:text-purple-300 rounded-lg transition-colors"
              >
                <Link href={item.path} className="flex items-center gap-3 w-full p-3">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
        <SidebarMenuButton
          onClick={() => signOut({ redirectUrl: '/login' })}
          className="w-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;