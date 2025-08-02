import React, { useState } from 'react';
import { MenuBar } from '@/components/ui/glow-menu';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Settings,
  Bell,
} from 'lucide-react';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider, useTheme } from 'next-themes';

function AdminEventsContent() {
  const { theme, setTheme } = useTheme();
  const [activeMenuItem, setActiveMenuItem] = useState("Events");

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard", gradient: "from-blue-500 to-purple-600", iconColor: "text-blue-400" },
    { name: "Events", icon: CalendarIcon, label: "Events", href: "/admin-events", gradient: "from-green-500 to-cyan-600", iconColor: "text-green-400" },
    { name: "Users", icon: Users, label: "Users", href: "#", gradient: "from-red-500 to-orange-600", iconColor: "text-red-400" },
    { name: "Settings", icon: Settings, label: "Settings", href: "#", gradient: "from-yellow-500 to-amber-600", iconColor: "text-yellow-400" },
    { name: "Notifications", icon: Bell, label: "Notifications", href: "#", gradient: "from-pink-500 to-rose-600", iconColor: "text-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>
      <div className="relative z-10">
        <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <h1 className="text-3xl font-bold tracking-tighter mb-6">Admin Events</h1>
          {/* Add event management content here */}
        </div>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AdminEventsContent />
    </ThemeProvider>
  );
}