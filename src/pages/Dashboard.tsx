import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";
import { EventDiscoveryWidget } from "@/components/dashboard/EventDiscoveryWidget";
import { RegisteredEventsWidget } from "@/components/dashboard/RegisteredEventsWidget";
import { CertificatesWidget } from "@/components/dashboard/CertificatesWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { ProfileWidget } from "@/components/dashboard/ProfileWidget";
import { EventDiscoveryGrid } from "@/components/dashboard/EventDiscoveryGrid";

export default function Dashboard() {
  const dockItems = [
    { icon: <Home size={20} />, label: 'Home', href: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Events', href: '/events' },
    { icon: <Trophy size={20} />, label: 'Trophy', href: '/certificates' },
    { icon: <User size={20} />, label: 'Profile', href: '/profile' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' }
  ];

  return (
    <Protected>
      {/* Top Dock */}
      <Dock items={dockItems} />

      {/* Theme Switcher */}
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>

      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 px-6 pt-24 pb-16">
        {/* DASHBOARD Heading */}
        <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-black dark:text-white mb-8">
          DASHBOARD
        </h1>

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_280px] gap-4 mb-12">
          {/* Left Column - Profile */}
          <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">YOUR PROFILE</p>
            <ProfileWidget />
          </div>

          {/* Middle Column - Discover Events + Certificates */}
          <div className="flex flex-col gap-4">
            {/* Discover Events */}
            <div className="border-2 border-black dark:border-white bg-[#c8f0e0] dark:bg-emerald-900/30 p-5 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-3">DISCOVER EVENTS</p>
              <EventDiscoveryWidget />
            </div>

            {/* Certificates */}
            <div className="border-2 border-black dark:border-white bg-[#f5c8e8] dark:bg-pink-900/30 p-5 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-3">CERTIFICATES</p>
              <CertificatesWidget />
            </div>
          </div>

          {/* Right Column - Quick Stats + Registered Events */}
          <div className="flex flex-col gap-4">
            {/* Quick Stats */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">QUICK STATS</p>
              <QuickStatsWidget />
            </div>

            {/* Registered Events */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 flex-1 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">REGISTERED EVENTS</p>
              <RegisteredEventsWidget />
            </div>
          </div>
        </div>

        {/* EVENT DISCOVERY Section */}
        <div className="mb-6">
          <EventDiscoveryGrid />
        </div>
      </div>
    </Protected>
  );
}