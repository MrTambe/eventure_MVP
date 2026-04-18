import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings, HelpCircle, MessageSquare } from "lucide-react";
import { EventDiscoveryWidget } from "@/components/dashboard/EventDiscoveryWidget";
import { RegisteredEventsWidget } from "@/components/dashboard/RegisteredEventsWidget";
import { CertificatesWidget } from "@/components/dashboard/CertificatesWidget";
import { QuickStatsWidget } from "@/components/dashboard/QuickStatsWidget";
import { ProfileWidget } from "@/components/dashboard/ProfileWidget";
import { EventDiscoveryGrid } from "@/components/dashboard/EventDiscoveryGrid";
import { BroadcastWidget } from "@/components/dashboard/BroadcastWidget";
import { WinnersWidget } from "@/components/dashboard/WinnersWidget";
import { CreateTicketModal } from "@/components/dashboard/CreateTicketModal";
import { TicketsListPanel } from "@/components/dashboard/TicketsListPanel";
import { useState } from "react";

export default function Dashboard() {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketsListOpen, setTicketsListOpen] = useState(false);

  const dockItems = [
    { icon: <Home size={20} />, label: 'Home', href: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Events', href: '/events' },
    { icon: <MessageSquare size={20} />, label: 'Communication', href: '/communication' },
    { icon: <Trophy size={20} />, label: 'Trophy', href: '/certificates' },
    { icon: <User size={20} />, label: 'Profile', href: '/profile' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' }
  ];

  return (
    <Protected>
      {/* Ticket Modal */}
      <CreateTicketModal isOpen={ticketModalOpen} onClose={() => setTicketModalOpen(false)} />
      {/* Tickets List Panel */}
      <TicketsListPanel
        isOpen={ticketsListOpen}
        onClose={() => setTicketsListOpen(false)}
        onCreateNew={() => setTicketModalOpen(true)}
      />

      {/* Top Dock */}
      <Dock items={dockItems} />

      {/* Theme Switcher */}
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>

      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 px-6 pt-24 pb-16">
        {/* DASHBOARD Heading + Support Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-black dark:text-white">
            DASHBOARD
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTicketsListOpen(true)}
              className="flex items-center gap-2 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              My Tickets
            </button>
            <button
              onClick={() => setTicketModalOpen(true)}
              className="flex items-center gap-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all"
            >
              <HelpCircle className="h-4 w-4" />
              Support
            </button>
          </div>
        </div>

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_280px] gap-4 mb-12">
          {/* Left Column - Profile */}
          <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">YOUR PROFILE</p>
            <ProfileWidget />
          </div>

          {/* Middle Column - Discover Events + Certificates */}
          <div className="flex flex-col gap-4">
            {/* Discover Events */}
            <div className="border-2 border-black dark:border-white bg-[#c8f0e0] dark:bg-emerald-900/30 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-3">DISCOVER EVENTS</p>
              <EventDiscoveryWidget />
            </div>

            {/* Certificates */}
            <div className="border-2 border-black dark:border-white bg-[#f5c8e8] dark:bg-pink-900/30 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-3">CERTIFICATES</p>
              <CertificatesWidget />
            </div>
          </div>

          {/* Right Column - Quick Stats + Registered Events */}
          <div className="flex flex-col gap-4">
            {/* Quick Stats */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">QUICK STATS</p>
              <QuickStatsWidget />
            </div>

            {/* Registered Events */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">REGISTERED EVENTS</p>
              <RegisteredEventsWidget />
            </div>
          </div>
        </div>

        {/* Broadcasts + EVENT DISCOVERY Section */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 mb-6">
          {/* Broadcasts */}
          <div className="border-2 border-black dark:border-white bg-[#fff8e8] dark:bg-amber-900/20 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-3">LATEST BROADCASTS</p>
            <BroadcastWidget />
          </div>

          {/* Event Discovery */}
          <div>
            <EventDiscoveryGrid />
          </div>
        </div>

        {/* Winners Section */}
        <div className="border-2 border-black dark:border-white bg-[#fffbe8] dark:bg-yellow-900/20 p-5 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-3">🏆 WINNERS</p>
          <WinnersWidget />
        </div>
      </div>
    </Protected>
  );
}