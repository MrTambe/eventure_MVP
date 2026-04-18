import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings, MessageSquare, Megaphone, AlertTriangle, Clock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState } from "react";

type EventMsg = { _id: string; eventId: string; eventName: string; authorName: string; content: string; _creationTime: number };
type BroadcastMsg = { _id: string; content: string; channel: string; authorName: string; _creationTime: number };

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today, ${time}`;
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${days}d ago, ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Communication() {
  const eventMessages = useQuery(api.communication.getUserEventCommunications);
  const broadcasts = useQuery(api.communication.getLatestBroadcasts);
  const [activeTab, setActiveTab] = useState<"broadcasts" | "events">("broadcasts");

  const dockItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Calendar size={20} />, label: "Events", href: "/events" },
    { icon: <MessageSquare size={20} />, label: "Communication", href: "/communication" },
    { icon: <Trophy size={20} />, label: "Certificates", href: "/certificates" },
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
  ];

  // Group event messages by event
  const groupedByEvent = ((eventMessages ?? []) as EventMsg[]).reduce<Record<string, EventMsg[]>>((acc: Record<string, EventMsg[]>, msg: EventMsg) => {
    if (!msg) return acc;
    if (!acc[msg.eventId]) acc[msg.eventId] = [];
    acc[msg.eventId].push(msg);
    return acc;
  }, {});

  const eventGroups = Object.entries(groupedByEvent).map(([eventId, msgs]) => ({
    eventId,
    eventName: msgs[0]?.eventName ?? "Unknown Event",
    messages: msgs,
  }));

  return (
    <Protected>
      <Dock items={dockItems} />
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>

      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 px-6 pt-24 pb-16 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-2">
            COMMUNICATIONS
          </h1>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
            Announcements & event messages
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-2 border-black dark:border-white w-fit">
          <button
            onClick={() => setActiveTab("broadcasts")}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
              activeTab === "broadcasts"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5" />
              Broadcasts
            </span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white ${
              activeTab === "events"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              My Events
            </span>
          </button>
        </div>

        {/* Broadcasts Tab */}
        {activeTab === "broadcasts" && (
          <motion.div
            key="broadcasts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {broadcasts === undefined ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-12 text-center shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
                <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-black uppercase text-muted-foreground text-sm">No broadcasts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(broadcasts as BroadcastMsg[]).map((msg: BroadcastMsg, i: number) => {
                  const channelColors: Record<string, string> = {
                    announcements: "bg-blue-400 text-black",
                    urgent: "bg-red-400 text-black",
                    general: "bg-green-400 text-black",
                  };
                  const channelLabels: Record<string, string> = {
                    announcements: "ANNOUNCEMENT",
                    urgent: "URGENT",
                    general: "GENERAL",
                  };
                  const colorClass = channelColors[msg.channel] ?? channelColors.general;
                  const label = channelLabels[msg.channel] ?? "GENERAL";

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase border border-black ${colorClass}`}>
                          {msg.channel === "urgent" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Megaphone className="h-3 w-3" />
                          )}
                          {label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                          <Clock className="h-3 w-3" />
                          {formatTime(msg._creationTime)}
                        </span>
                      </div>
                      <p className="text-sm text-black dark:text-white leading-relaxed">
                        {msg.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">
                        — {msg.authorName}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* My Events Tab */}
        {activeTab === "events" && (
          <motion.div
            key="events"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {eventMessages === undefined ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white" />
              </div>
            ) : eventGroups.length === 0 ? (
              <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-12 text-center shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-black uppercase text-muted-foreground text-sm">No event messages</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Register for events to see their communications here.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {eventGroups.map((group, gi: number) => (
                  <motion.div
                    key={group.eventId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.08 }}
                  >
                    {/* Event Header */}
                    <div className="border-2 border-black dark:border-white bg-black dark:bg-white px-4 py-2 mb-3 inline-block">
                      <span className="text-xs font-black uppercase text-white dark:text-black tracking-widest">
                        {group.eventName}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3 pl-4 border-l-4 border-black dark:border-white">
                      {group.messages.map((msg: EventMsg, mi: number) => (
                        <motion.div
                          key={msg._id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gi * 0.08 + mi * 0.04 }}
                          className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-4 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-black dark:text-white border border-black dark:border-white px-2 py-0.5">
                              {msg.authorName}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                              <Clock className="h-3 w-3" />
                              {formatTime(msg._creationTime)}
                            </span>
                          </div>
                          <p className="text-sm text-black dark:text-white leading-relaxed">
                            {msg.content}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Protected>
  );
}