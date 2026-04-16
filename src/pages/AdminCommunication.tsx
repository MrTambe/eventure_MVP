import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminNavBar } from '@/components/admin/admin-navbar';
import { Dock } from '@/components/ui/dock';
import { Home, Calendar, Users, Settings, MessageSquare, Radio, Hash, Megaphone } from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', url: '/admin-dashboard', icon: Home },
  { name: 'Events', url: '/admin-events', icon: Calendar },
  { name: 'Communication', url: '/admin-communication', icon: MessageSquare },
  { name: 'Team', url: '/admin-team', icon: Users },
  { name: 'Settings', url: '/admin-settings', icon: Settings },
];

const DOCK_ITEMS = [
  { icon: <Home size={20} />, label: 'Dashboard', href: '/admin-dashboard' },
  { icon: <Calendar size={20} />, label: 'Events', href: '/admin-events' },
  { icon: <MessageSquare size={20} />, label: 'Comms', href: '/admin-communication' },
  { icon: <Users size={20} />, label: 'Team', href: '/admin-team' },
  { icon: <Settings size={20} />, label: 'Settings', href: '/admin-settings' },
];

type Tab = 'broadcasts' | 'channels';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all cursor-pointer ${
        active
          ? 'bg-[#6D28D9] text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]'
          : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      {label}
    </button>
  );
}

function BroadcastsSidebar() {
  const channels = ['General', 'Announcements', 'Urgent'];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        Channels
      </p>
      {channels.map((ch, i) => (
        <motion.button
          key={ch}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:bg-[#6D28D9] hover:text-white transition-colors cursor-pointer flex items-center gap-2"
        >
          <Megaphone size={14} />
          {ch}
        </motion.button>
      ))}
    </div>
  );
}

function EventChannelsSidebar() {
  const events = ['Tech Fest 2024', 'Hackathon', 'Workshop Series'];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        Event Channels
      </p>
      {events.map((ev, i) => (
        <motion.button
          key={ev}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:bg-[#6D28D9] hover:text-white transition-colors cursor-pointer flex items-center gap-2"
        >
          <Hash size={14} />
          {ev}
        </motion.button>
      ))}
    </div>
  );
}

function BroadcastsContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col items-center justify-center gap-4 py-16"
    >
      <div className="w-20 h-20 border-[3px] border-black dark:border-white bg-[#6D28D9]/10 flex items-center justify-center">
        <Radio size={36} className="text-[#6D28D9]" />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
        Broadcasts
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
        Send announcements and updates to all users. Select a channel from the sidebar to get started.
      </p>
    </motion.div>
  );
}

function EventChannelsContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col items-center justify-center gap-4 py-16"
    >
      <div className="w-20 h-20 border-[3px] border-black dark:border-white bg-[#6D28D9]/10 flex items-center justify-center">
        <Hash size={36} className="text-[#6D28D9]" />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
        Event Channels
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
        Communicate with participants of specific events. Select an event channel from the sidebar.
      </p>
    </motion.div>
  );
}

export default function AdminCommunication() {
  const [activeTab, setActiveTab] = useState<Tab>('broadcasts');

  return (
    <div className="min-h-screen bg-[#FDF8F3] dark:bg-neutral-950 flex flex-col">
      {/* Admin Navbar */}
      <AdminNavBar items={ADMIN_NAV_ITEMS} />

      {/* Main content */}
      <div className="flex-1 pt-20 pb-28 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Page heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white mb-6"
        >
          Communication
        </motion.h1>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6">
          <TabButton label="Broadcasts" active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} />
          <TabButton label="Event Channels" active={activeTab === 'channels'} onClick={() => setActiveTab('channels')} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-[#FDF8F3] dark:bg-neutral-900 p-4"
          >
            {activeTab === 'broadcasts' ? <BroadcastsSidebar /> : <EventChannelsSidebar />}
          </motion.div>

          {/* Main content area */}
          <div className="border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-6 min-h-[400px] flex">
            {activeTab === 'broadcasts' ? <BroadcastsContent /> : <EventChannelsContent />}
          </div>
        </div>
      </div>

      {/* Bottom Dock */}
      <Dock items={DOCK_ITEMS} className="!top-auto !bottom-4" />
    </div>
  );
}