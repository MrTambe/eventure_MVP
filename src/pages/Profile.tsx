import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";

export default function Profile() {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h1 className="text-3xl font-bold">Profile Page</h1>
      </div>
    </Protected>
  );
}