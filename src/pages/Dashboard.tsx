import { Protected } from "@/lib/protected-page";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";

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
      <BackgroundPaths title="Event Dashboard" />
    </Protected>
  );
}