import { Protected } from "@/lib/protected-page";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import {
  BellIcon,
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  InputIcon,
} from "@radix-ui/react-icons";

const bentoItems: BentoItem[] = [
  {
    icon: <FileTextIcon />,
    title: "Save your files",
    description: "We automatically save your files as you type.",
    cta: "Learn more",
    colSpan: 2,
    hasPersistentHover: true,
  },
  {
    icon: <InputIcon />,
    title: "Full text search",
    description: "Search through all your files in one place.",
    cta: "Learn more",
  },
  {
    icon: <GlobeIcon />,
    title: "Multilingual",
    description: "Supports 100+ languages and counting.",
    cta: "Learn more",
  },
  {
    icon: <CalendarIcon />,
    title: "Calendar",
    description: "Use the calendar to filter your files by date.",
    cta: "Learn more",
  },
  {
    icon: <BellIcon />,
    title: "Notifications",
    description:
      "Get notified when someone shares a file or mentions you in a comment.",
    cta: "Learn more",
    colSpan: 2,
  },
];

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
      
      {/* Theme Switcher positioned in top-right corner, aligned with navbar */}
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>
      
      {/* Event Dashboard title */}
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="pt-48 flex flex-wrap justify-center">
        <BentoGrid items={bentoItems} />
      </div>
    </Protected>
  );
}