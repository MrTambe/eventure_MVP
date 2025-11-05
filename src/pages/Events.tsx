// @ts-nocheck
/* eslint-disable */
import { Navbar } from "@/components/navigation/Navbar";
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
  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Certificates', url: '/certificates', icon: Trophy },
    { name: 'Profile', url: '/profile', icon: User },
    { name: 'Settings', url: '/settings', icon: Settings }
  ];

  // Load events from backend (active, completed, etc. — all events)
  const events = useQuery(api.events.list);

  return (
    <div className="min-h-screen relative">
      <Navbar items={navItems} />
      
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