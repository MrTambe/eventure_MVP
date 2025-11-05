import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { EventDiscoveryWidget } from "@/components/dashboard/EventDiscoveryWidget";
import { RegisteredEventsWidget } from "@/components/dashboard/RegisteredEventsWidget";
import { CertificatesWidget } from "@/components/dashboard/CertificatesWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { ProfileWidget } from "@/components/dashboard/ProfileWidget";

export default function Dashboard() {
  const dockItems = [
    { icon: <Home size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Events', href: '/events' },
    { icon: <Trophy size={20} />, label: 'Certificates', href: '/certificates' },
    { icon: <User size={20} />, label: 'Profile', href: '/profile' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' }
  ];

  return (
    <Protected>
      <Dock items={dockItems} />
      
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>
      
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-48 pb-24">
        <BentoGrid className="grid-cols-1 md:grid-cols-6 lg:grid-cols-6 auto-rows-[200px]">
          {/* Top Left - Quick Stats */}
          <BentoCard 
            title="Quick Stats" 
            className="md:col-span-2 md:row-span-1"
            gradient="from-blue-500/20 via-cyan-500/10 to-blue-500/5"
          >
            <QuickStatsWidget />
          </BentoCard>

          {/* Top Middle - Discover Events */}
          <BentoCard 
            title="Discover Events" 
            description="Find and register for upcoming events" 
            className="md:col-span-2 md:row-span-1"
            gradient="from-green-500/20 via-emerald-500/10 to-green-500/5"
          >
            <EventDiscoveryWidget />
          </BentoCard>

          {/* Top Right - Profile (Tall) */}
          <BentoCard 
            title="Your Profile" 
            className="md:col-span-2 md:row-span-3"
            gradient="from-purple-500/20 via-violet-500/10 to-purple-500/5"
          >
            <ProfileWidget />
          </BentoCard>

          {/* Middle Left - Registered Events (Wide & Tall) */}
          <BentoCard 
            title="Registered Events" 
            description="Your upcoming events" 
            className="md:col-span-4 md:row-span-2"
            gradient="from-orange-500/20 via-amber-500/10 to-orange-500/5"
          >
            <RegisteredEventsWidget />
          </BentoCard>

          {/* Bottom Left - Certificates */}
          <BentoCard 
            title="Certificates" 
            description="Your achievements"
            className="md:col-span-2 md:row-span-1"
            gradient="from-pink-500/20 via-rose-500/10 to-pink-500/5"
          >
            <CertificatesWidget />
          </BentoCard>

          {/* Bottom Middle - Additional Card */}
          <BentoCard 
            title="Event Discovery" 
            description="Explore more"
            className="md:col-span-2 md:row-span-1"
            gradient="from-cyan-500/20 via-teal-500/10 to-cyan-500/5"
          >
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </Protected>
  );
}