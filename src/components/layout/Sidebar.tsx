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
    <ShadcnSidebar className="border-r border-purple-200/50 bg-gradient-to-b from-white via-purple-50/50 to-blue-50/80 backdrop-blur-xl shadow-xl">
      <SidebarHeader className="p-6 border-b border-purple-200/30">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl p-3 shadow-lg ring-2 ring-purple-200/50">
            <span className="font-bold text-white text-2xl drop-shadow-md">W</span>
          </div>
          <h1 className="text-slate-800 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Writlix</h1>
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
                className="w-full mb-3 bg-transparent hover:bg-purple-100/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-500 data-[active=true]:to-blue-500 data-[active=true]:text-white data-[active=true]:shadow-lg rounded-xl transition-all duration-200 text-slate-700 hover:text-slate-800 relative overflow-hidden"
              >
                <Link href={item.path} className="flex items-center gap-3 w-full p-3 relative z-10">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-purple-200/30">
        <SidebarMenuButton
          onClick={() => signOut({ redirectUrl: '/login' })}
          className="w-full hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-300 hover:shadow-md"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;