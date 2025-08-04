import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from "@/lib/utils";
import { IconUser, IconCalendarEvent } from "@tabler/icons-react";
import { MenuBar } from '@/components/ui/glow-menu';
import { LayoutDashboard, Calendar as CalendarIcon, Users, Settings, Bell, Home, Calendar } from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { toast } from "sonner";
import { Id } from '@/convex/_generated/dataModel';

interface AdminProfileCardProps {
  name: string;
  email: string;
  events: { _id: Id<"events">; name: string }[];
  index: number;
}

const AdminProfileCard: React.FC<AdminProfileCardProps> = ({ name, email, events, index }) => {
  return (
    <div
      className={cn(
        "relative p-6 rounded-2xl overflow-hidden transition-all duration-300",
        "bg-white/80 dark:bg-black/80 border-2 border-black dark:border-white/20",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)]",
        "hover:-translate-y-1"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
          <IconUser className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">{name}</h3>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <IconCalendarEvent className="w-5 h-5" />
          Events Created
        </h4>
        {events.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            {events.map(event => (
              <li key={event._id}>{event.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No events created</p>
        )}
      </div>
    </div>
  );
};

const AdminTeamPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("Team");
  const adminsWithEvents = useQuery(api.admin.getAllAdminsWithEvents);

  const menuItems = [
    { name: "Dashboard", icon: Home, label: "Dashboard", href: "/admin-dashboard", gradient: "from-blue-500 to-purple-600", iconColor: "text-blue-400" },
    { name: "Events", icon: Calendar, label: "Events", href: "/admin-events", gradient: "from-green-500 to-cyan-600", iconColor: "text-green-400" },
    { name: "Team", icon: Users, label: "Team", href: "/admin-team", gradient: "from-red-500 to-orange-600", iconColor: "text-red-400" },
    { name: "Settings", icon: Settings, label: "Settings", href: "/admin-settings", gradient: "from-yellow-500 to-amber-600", iconColor: "text-yellow-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
       <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        </div>
        <div className="pt-24">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-10">Admin Team</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto gap-4">
            {adminsWithEvents?.map((admin, index) => (
              <AdminProfileCard 
                key={admin._id}
                name={admin.name || 'Unnamed Admin'}
                email={admin.email}
                events={admin.events}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTeamPage;