import { Protected } from "@/lib/protected-page";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { EventDiscoveryWidget } from "@/components/dashboard/EventDiscoveryWidget";
import { RegisteredEventsWidget } from "@/components/dashboard/RegisteredEventsWidget";
import { CertificatesWidget } from "@/components/dashboard/CertificatesWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { ProfileWidget } from "@/components/dashboard/ProfileWidget";

export default function Dashboard() {
  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Certificates', url: '/certificates', icon: Trophy },
    { name: 'Profile', url: '/profile', icon: User },
    { name: 'Settings', url: '/settings', icon: Settings }
  ];

  return (
    <Protected>
      <NavBar items={navItems} />
      
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
        <BentoGrid>
          <BentoCard title="Quick Stats" colSpan="3">
            <QuickStatsWidget />
          </BentoCard>

          <BentoCard title="Discover Events" description="Find and register for upcoming events" colSpan="2" rowSpan="2">
            <EventDiscoveryWidget />
          </BentoCard>

          <BentoCard title="Your Profile" rowSpan="2">
            <ProfileWidget />
          </BentoCard>

          <BentoCard title="Registered Events" description="Your upcoming events" colSpan="2">
            <RegisteredEventsWidget />
          </BentoCard>

          <BentoCard title="Certificates" description="Your achievements">
            <CertificatesWidget />
          </BentoCard>
        </BentoGrid>
      </div>
    </Protected>
  );
}