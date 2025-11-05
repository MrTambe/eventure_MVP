import { Protected } from "@/lib/protected-page";
import { Navbar } from "@/components/navigation/Navbar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";

export default function Profile() {
  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Certificates', url: '/certificates', icon: Trophy },
    { name: 'Profile', url: '/profile', icon: User },
    { name: 'Settings', url: '/settings', icon: Settings }
  ];

  return (
    <Protected>
      <Navbar items={navItems} />
      
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>
      
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80">
            Profile
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-48 pb-24">
        <p className="text-center text-muted-foreground">Profile page content coming soon...</p>
      </div>
    </Protected>
  );
}