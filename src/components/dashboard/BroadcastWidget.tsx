import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Megaphone, AlertTriangle, MessageSquare } from "lucide-react";

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

type BroadcastMsg = { _id: string; content: string; channel: string; authorName: string; _creationTime: number };

const channelConfig: Record<string, { icon: typeof Megaphone; color: string; label: string }> = {
  announcements: { icon: Megaphone, color: "bg-blue-400 text-black", label: "ANNOUNCEMENT" },
  urgent: { icon: AlertTriangle, color: "bg-red-400 text-black", label: "URGENT" },
  general: { icon: MessageSquare, color: "bg-green-400 text-black", label: "GENERAL" },
};

export function BroadcastWidget() {
  const broadcasts = useQuery(api.communication.getLatestBroadcasts);

  if (broadcasts === undefined) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black dark:border-white" />
      </div>
    );
  }

  if (!broadcasts || broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Megaphone className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs font-bold text-muted-foreground uppercase">No broadcasts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
      {(broadcasts as BroadcastMsg[]).map((msg: BroadcastMsg, i: number) => {
        const config = channelConfig[msg.channel] || channelConfig.general;
        const Icon = config.icon;
        return (
          <motion.div
            key={msg._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border-2 border-black dark:border-white p-3 bg-white dark:bg-neutral-800"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase border border-black ${config.color}`}>
                <Icon className="h-2.5 w-2.5" />
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">
                {formatTime(msg._creationTime)}
              </span>
            </div>
            <p className="text-xs text-black dark:text-white leading-relaxed line-clamp-3">
              {msg.content}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold">
              — {msg.authorName}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}