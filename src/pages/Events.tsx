// @ts-nocheck
/* eslint-disable */
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import {
  Home,
  Calendar,
  Trophy,
  User,
  Settings,
  Clock,
  MapPin,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1544717684-7ba720c2b5ea?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=300&fit=crop",
];

function getPlaceholderImage(id: string) {
  const idx = id.charCodeAt(id.length - 1) % PLACEHOLDER_IMAGES.length;
  return PLACEHOLDER_IMAGES[idx];
}

function toTimestamp(val: number | Date | unknown): number {
  if (val instanceof Date) return val.getTime();
  if (typeof val === "number") return val;
  return 0;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getEventStatus(event: any): { label: string; color: string } {
  const now = Date.now();
  const start = toTimestamp(event.startDate);
  const end = toTimestamp(event.endDate);
  if (now >= start && now <= end) {
    return { label: "ONGOING", color: "bg-yellow-400 text-black border-black" };
  } else if (now < start) {
    return { label: "UPCOMING", color: "bg-blue-500 text-white border-blue-700" };
  } else {
    return { label: "COMPLETED", color: "bg-neutral-400 text-black border-black" };
  }
}

function EventCard({ event, index }: { event: any; index: number }) {
  const navigate = useNavigate();
  const status = getEventStatus(event);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => navigate(`/event/${event._id}`)}
      className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] overflow-hidden flex flex-col cursor-pointer hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#fff] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={getPlaceholderImage(event._id)}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-black uppercase px-2 py-1 border-2 ${status.color}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-black text-base uppercase tracking-tight text-black dark:text-white leading-tight">
          {event.name}
        </h3>

        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-black dark:text-white font-semibold mt-auto pt-2">
          <Calendar size={12} />
          <span>{formatDate(toTimestamp(event.startDate))}</span>
        </div>

        {event.venue && (
          <div className="flex items-center gap-2 text-xs text-black dark:text-white font-semibold">
            <MapPin size={12} />
            <span className="truncate">{event.venue}</span>
          </div>
        )}

        <div className="mt-2 pt-2 border-t-2 border-black dark:border-white">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            CLICK TO VIEW DETAILS →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Events() {
  const dockItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Calendar size={20} />, label: "Events", href: "/events" },
    { icon: <Trophy size={20} />, label: "Certificates", href: "/certificates" },
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
  ];

  const events = useQuery(api.events.list);

  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 relative">
      <Dock items={dockItems} />

      <div className="fixed top-0 right-6 z-[100] pt-6">
        <ThemeSwitcher />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-2">
              ALL EVENTS
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              Discover and explore all institutional events and workshops.
            </p>
          </div>
          <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] px-5 py-3 text-center min-w-[80px]">
            <div className="text-3xl font-black text-black dark:text-white">{events?.length ?? 0}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">TOTAL</div>
          </div>
        </div>

        {!events ? (
          <div className="text-sm text-muted-foreground text-center py-20">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] p-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">
              NO EVENTS FOUND
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Check back later for upcoming events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <EventCard key={event._id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}