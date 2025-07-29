import { Protected } from "@/lib/protected-page";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings } from "lucide-react";
import { BrutalistSportsCard } from "@/components/ui/brutalist-sports-card";
import {
  Bike,
  Circle,
  Sword,
  Zap,
  Target,
  Crown,
  Gamepad2,
  CircleDot,
  Flag
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function Events() {
  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Certificates', url: '/certificates', icon: Trophy },
    { name: 'Profile', url: '/profile', icon: User },
    { name: 'Settings', url: '/settings', icon: Settings }
  ];

  const events = [
    {
      id: 1,
      eventId: "1" as Id<"events">,
      sport: "Cycling",
      title: "INTER-COLLEGE CYCLING CHAMPIONSHIP",
      date: "Dec 15, 2024",
      time: "8:00 AM",
      venue: "Sports Complex Track",
      icon: Bike
    },
    {
      id: 2,
      eventId: "2" as Id<"events">,
      sport: "Basketball",
      title: "ANNUAL BASKETBALL TOURNAMENT",
      date: "Dec 16, 2024",
      time: "10:00 AM",
      venue: "Main Basketball Court",
      icon: Circle
    },
    {
      id: 3,
      eventId: "3" as Id<"events">,
      sport: "Fencing",
      title: "COLLEGIATE FENCING CHAMPIONSHIP",
      date: "Dec 17, 2024",
      time: "2:00 PM",
      venue: "Indoor Sports Hall",
      icon: Sword
    },
    {
      id: 4,
      eventId: "4" as Id<"events">,
      sport: "Badminton",
      title: "BADMINTON SINGLES & DOUBLES",
      date: "Dec 18, 2024",
      time: "9:00 AM",
      venue: "Badminton Courts 1-4",
      icon: Zap
    },
    {
      id: 5,
      eventId: "5" as Id<"events">,
      sport: "Table Tennis",
      title: "PING PONG CHAMPIONSHIP",
      date: "Dec 19, 2024",
      time: "11:00 AM",
      venue: "Recreation Center",
      icon: Target
    },
    {
      id: 6,
      eventId: "6" as Id<"events">,
      sport: "Tennis",
      title: "TENNIS OPEN TOURNAMENT",
      date: "Dec 20, 2024",
      time: "7:00 AM",
      venue: "Tennis Courts A-D",
      icon: Circle
    },
    {
      id: 7,
      eventId: "7" as Id<"events">,
      sport: "Cricket",
      title: "INTER-DEPARTMENT CRICKET LEAGUE",
      date: "Dec 21, 2024",
      time: "1:00 PM",
      venue: "Cricket Ground",
      icon: Target
    },
    {
      id: 8,
      eventId: "8" as Id<"events">,
      sport: "Athletics",
      title: "TRACK & FIELD CHAMPIONSHIP",
      date: "Dec 22, 2024",
      time: "6:00 AM",
      venue: "Athletic Stadium",
      icon: Crown
    },
    {
      id: 9,
      eventId: "9" as Id<"events">,
      sport: "Carrom",
      title: "CARROM BOARD COMPETITION",
      date: "Dec 23, 2024",
      time: "3:00 PM",
      venue: "Student Activity Center",
      icon: Target
    },
    {
      id: 10,
      eventId: "10" as Id<"events">,
      sport: "Chess",
      title: "STRATEGIC CHESS TOURNAMENT",
      date: "Dec 24, 2024",
      time: "10:00 AM",
      venue: "Library Conference Room",
      icon: Gamepad2
    },
    {
      id: 11,
      eventId: "11" as Id<"events">,
      sport: "Football",
      title: "FOOTBALL CHAMPIONSHIP CUP",
      date: "Dec 25, 2024",
      time: "4:00 PM",
      venue: "Main Football Field",
      icon: CircleDot
    },
    {
      id: 12,
      eventId: "12" as Id<"events">,
      sport: "Golf",
      title: "COLLEGIATE GOLF TOURNAMENT",
      date: "Dec 26, 2024",
      time: "8:00 AM",
      venue: "University Golf Course",
      icon: Flag
    }
  ];

  return (
    <Protected>
      <NavBar items={navItems} />
      
      {/* Theme Switcher positioned in top-right corner, aligned with navbar */}
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>
      
      {/* All Events title */}
      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80">
            All Events
          </h1>
        </div>
      </div>

      <div className="pt-48 flex flex-wrap justify-center gap-6">
        {events.map((event) => (
          <BrutalistSportsCard
            key={event.id}
            sport={event.sport}
            title={event.title}
            date={event.date}
            time={event.time}
            venue={event.venue}
            icon={event.icon}
            eventId={event.eventId}
          />
        ))}
      </div>
    </Protected>
  );
}