// @ts-nocheck
/* eslint-disable */
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { BrutalistSportsCard } from "@/components/ui/brutalist-sports-card";
import {
  Home,
  Calendar,
  Trophy,
  User,
  Settings,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Events() {
  const dockItems = [
    { icon: <Home size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Events', href: '/events' },
    { icon: <Trophy size={20} />, label: 'Certificates', href: '/certificates' },
    { icon: <User size={20} />, label: 'Profile', href: '/profile' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' }
  ];

  // Load events from backend (active, completed, etc. — all events)
  const events = useQuery(api.events.list);

  return (
    <div className="min-h-screen relative">
      <Dock items={dockItems} />
      
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>
      
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80">
            All Events
          </h1>
        </div>
      </div>

      <div className="pt-48 pb-24 flex flex-wrap justify-center relative z-[60]">
        {!events ? (
          <div className="text-sm text-muted-foreground">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-muted-foreground">No events found.</div>
        ) : (
          events.map((event) => {
            const start = new Date(event.startDate);
            const date = start.toLocaleDateString();
            const time = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <BrutalistSportsCard
                key={event._id}
                sport={event.name || "Event"}
                title={event.name}
                date={date}
                time={time}
                venue={event.venue}
                icon={Calendar}
                viewPath={`/event/${event._id}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}