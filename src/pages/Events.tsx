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
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";

// Placeholder images for events without images
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

function formatTimeRange(start: number, end: number) {
  const fmt = (t: number) =>
    new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

// Card for Ongoing / Upcoming events
function EventCard({
  event,
  status,
}: {
  event: any;
  status: "ONGOING" | "UPCOMING";
}) {
  const navigate = useNavigate();
  const registerForEvent = useMutation(api.dashboard.registerForEvent);

  const handleViewDetails = () => {
    navigate(`/event/${event._id}`);
  };

  const handleRegister = async () => {
    try {
      const result = await registerForEvent({ eventId: event._id });
      if (result.success) {
        toast.success(`Registered for ${event.name}!`);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Registration failed.");
    }
  };

  const handleSetReminder = () => {
    toast.success(`Reminder set for ${event.name}!`);
  };

  const daysUntil = Math.ceil((toTimestamp(event.startDate) - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] overflow-hidden flex flex-col"
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
            className={`text-[10px] font-black uppercase px-2 py-1 border-2 border-black ${
              status === "ONGOING"
                ? "bg-yellow-400 text-black"
                : "bg-blue-500 text-white border-blue-700"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-black text-base uppercase tracking-tight text-black dark:text-white leading-tight">
          {event.name}
        </h3>

        {status === "UPCOMING" && daysUntil > 0 && (
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            STARTING IN {daysUntil} DAY{daysUntil !== 1 ? "S" : ""}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-black dark:text-white font-semibold">
          <Calendar size={12} />
          <span>{formatDate(event.startDate)}</span>
        </div>

        {status === "ONGOING" && (
          <div className="flex items-center gap-2 text-xs text-black dark:text-white font-semibold">
            <Clock size={12} />
            <span>{formatTimeRange(event.startDate, event.endDate)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-black dark:text-white font-semibold">
          <MapPin size={12} />
          <span className="truncate">{event.venue}</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-auto pt-3">
          {status === "ONGOING" ? (
            <>
              <button
                onClick={handleViewDetails}
                className="flex-1 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white py-2 text-xs font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                VIEW DETAILS
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black py-2 text-xs font-black uppercase hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors"
              >
                REGISTER NOW!
              </button>
            </>
          ) : (
            <button
              onClick={handleSetReminder}
              className="flex-1 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white py-2 text-xs font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              SET REMINDER
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Section heading
function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-sm font-black uppercase tracking-widest text-black dark:text-white whitespace-nowrap">
        {label}
      </h2>
      <span className="text-xs font-black border-2 border-black dark:border-white px-2 py-0.5 bg-white dark:bg-neutral-900 text-black dark:text-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
        {String(count).padStart(2, "0")}
      </span>
      <div className="flex-1 h-[2px] bg-black dark:bg-white" />
    </div>
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
  const now = Date.now();

  const ongoingEvents = events?.filter((e) => toTimestamp(e.startDate) <= now && toTimestamp(e.endDate) >= now) ?? [];
  const upcomingEvents = events?.filter((e) => toTimestamp(e.startDate) > now) ?? [];
  const completedEvents = events?.filter((e) => toTimestamp(e.endDate) < now) ?? [];
  const totalLive = ongoingEvents.length + upcomingEvents.length;

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
              Manage and discover your educational journey through curated institutional events and workshops.
            </p>
          </div>
          {/* Total Live Badge */}
          <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] px-5 py-3 text-center min-w-[80px]">
            <div className="text-3xl font-black text-black dark:text-white">{totalLive}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">TOTAL LIVE</div>
          </div>
        </div>

        {!events ? (
          <div className="text-sm text-muted-foreground text-center py-20">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-20">No events found.</div>
        ) : (
          <>
            {/* Ongoing Events */}
            <section className="mb-12">
              <SectionHeading label="ONGOING EVENTS" count={ongoingEvents.length} />
              {ongoingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ongoing events.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ongoingEvents.map((event) => (
                    <EventCard key={event._id} event={event} status="ONGOING" />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Events */}
            <section className="mb-12">
              <SectionHeading label="UPCOMING EVENTS" count={upcomingEvents.length} />
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event._id} event={event} status="UPCOMING" />
                  ))}
                </div>
              )}
            </section>

            {/* Completed Events — Table */}
            <section>
              <SectionHeading label="COMPLETED EVENTS" count={completedEvents.length} />
              {completedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed events.</p>
              ) : (
                <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_140px_100px_140px] border-b-2 border-black dark:border-white px-4 py-3 bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">EVENT NAME</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">DATE</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">STATUS</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white text-right">ACTION</span>
                  </div>
                  {/* Table Rows */}
                  {completedEvents.map((event, i) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[1fr_140px_100px_140px] px-4 py-3 border-b border-black/10 dark:border-white/10 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <span className="text-xs font-black uppercase text-black dark:text-white truncate pr-4">
                        {event.name}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {formatDate(event.startDate)}
                      </span>
                      <span>
                        <span className="text-[10px] font-black uppercase border-2 border-black dark:border-white px-2 py-0.5 text-black dark:text-white">
                          CLOSED
                        </span>
                      </span>
                      <span className="text-right">
                        <button
                          onClick={() => toast.info(`Logs for ${event.name}`)}
                          className="text-[10px] font-black uppercase underline text-black dark:text-white hover:text-red-500 transition-colors"
                        >
                          DOWNLOAD LOGS
                        </button>
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}