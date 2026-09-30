import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import {
  Home, Calendar, Trophy, User, Settings, MessageSquare, Megaphone, AlertTriangle,
  Clock, Hash, ArrowLeft, Send, Users,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

type EventMsg = {
  _id: string; eventId: string; eventName: string; authorName: string;
  content: string; _creationTime: number; chatId?: string;
};
type BroadcastMsg = { _id: string; content: string; channel: string; authorName: string; _creationTime: number };
type ChattableEvent = {
  eventId: string; eventName: string; eventStatus: string;
  startDate: number; endDate: number; chatId: string | null; chatTitle: string | null;
};

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

export default function Communication() {
  const [activeTab, setActiveTab] = useState<"broadcasts" | "events">("broadcasts");
  const [openEvent, setOpenEvent] = useState<ChattableEvent | null>(null);

  const dockItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Calendar size={20} />, label: "Events", href: "/events" },
    { icon: <MessageSquare size={20} />, label: "Communication", href: "/communication" },
    { icon: <Trophy size={20} />, label: "Certificates", href: "/certificates" },
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
  ];

  return (
    <Protected>
      <Dock items={dockItems} />
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>

      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 px-4 sm:px-6 pt-24 pb-16 max-w-4xl mx-auto">
        {openEvent ? (
          <EventChatView event={openEvent} onBack={() => setOpenEvent(null)} />
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-2">
                COMMUNICATIONS
              </h1>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
                Announcements & event chats
              </p>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-0 mb-6 border-2 border-black dark:border-white w-fit">
              <button
                onClick={() => setActiveTab("broadcasts")}
                className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
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
                className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white cursor-pointer ${
                  activeTab === "events"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Event Chats
                </span>
              </button>
            </div>

            {activeTab === "broadcasts" ? <BroadcastsTab /> : <EventChatsTab onOpen={setOpenEvent} />}
          </>
        )}
      </div>
    </Protected>
  );
}

function BroadcastsTab() {
  const broadcasts = useQuery(api.communication.getLatestBroadcasts);
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
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
          {(broadcasts as BroadcastMsg[]).map((msg: BroadcastMsg, i: number) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase border border-black ${channelColors[msg.channel] ?? channelColors.general}`}>
                  {msg.channel === "urgent" ? <AlertTriangle className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
                  {channelLabels[msg.channel] ?? "GENERAL"}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                  <Clock className="h-3 w-3" />
                  {formatTime(msg._creationTime)}
                </span>
              </div>
              <p className="text-sm text-black dark:text-white leading-relaxed">{msg.content}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">— {msg.authorName}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EventChatsTab({ onOpen }: { onOpen: (e: ChattableEvent) => void }) {
  const myEvents = useQuery(api.communication.getMyChattableEvents);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      {myEvents === undefined ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white" />
        </div>
      ) : myEvents.length === 0 ? (
        <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-12 text-center shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-black uppercase text-muted-foreground text-sm">No event chats</p>
          <p className="text-xs text-muted-foreground mt-2">Register for events to join their chats here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(myEvents as ChattableEvent[]).map((ev, i: number) => {
            const statusBadge =
              ev.eventStatus === "active"
                ? { label: "ACTIVE", cls: "bg-green-400 text-black" }
                : ev.eventStatus === "completed"
                  ? { label: "COMPLETED", cls: "bg-neutral-300 text-black" }
                  : { label: "CANCELLED", cls: "bg-red-300 text-black" };
            return (
              <motion.button
                key={ev.eventId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => ev.chatId && onOpen(ev)}
                disabled={!ev.chatId}
                className={`w-full text-left border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-5 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] transition-all ${
                  ev.chatId ? "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] cursor-pointer" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="font-black uppercase text-black dark:text-white truncate">{ev.eventName}</p>
                    <p className="text-[11px] text-muted-foreground font-bold mt-0.5">
                      {ev.chatId ? (
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3 w-3" /> {ev.chatTitle} — tap to open chat
                        </span>
                      ) : (
                        "Chat unavailable"
                      )}
                    </p>
                  </div>
                  <div className="h-10 w-10 flex-shrink-0 border-2 border-black dark:border-white bg-[#6D28D9]/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-[#6D28D9]" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function EventChatView({ event, onBack }: { event: ChattableEvent; onBack: () => void }) {
  const messages = useQuery(
    api.communication.listEventChannelMessages,
    event.chatId ? { eventId: event.eventId as any, chatId: event.chatId } : "skip"
  );
  const sendMessage = useMutation(api.communication.postEventChannelMessage);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage({ eventId: event.eventId as any, content: trimmed, chatId: event.chatId ?? undefined });
      setContent("");
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="h-10 w-10 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 flex items-center justify-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
          title="Back to communications"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black dark:text-white truncate">
            {event.chatTitle || event.eventName}
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
            <Users className="h-3 w-3" /> {event.eventName}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
        <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {messages === undefined ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-black uppercase text-muted-foreground text-sm">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Say hi to kick things off!</p>
            </div>
          ) : (
            (messages as any[]).map((msg) => {
              const mine = false; // Could compare authorId with current user id
              return (
                <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] border-2 p-3 ${mine ? "bg-black dark:bg-white" : "bg-[#FDF8F3] dark:bg-neutral-800"} border-black dark:border-white`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wide text-[#6D28D9]">
                        {msg.authorName}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold">
                        {formatTime(msg._creationTime)}
                      </span>
                    </div>
                    <p className="text-sm text-black dark:text-white leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compose */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t-2 border-black dark:border-white p-3 bg-[#FDF8F3] dark:bg-neutral-800"
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Message #${event.chatTitle || event.eventName}...`}
            className="flex-1 min-w-0 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-black dark:text-white outline-none focus:shadow-[3px_3px_0px_#6D28D9] transition-shadow placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="h-9 px-4 flex-shrink-0 bg-[#6D28D9] text-white border-2 border-black dark:border-white flex items-center gap-1.5 text-xs font-black uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </form>
      </div>
    </motion.div>
  );
}
