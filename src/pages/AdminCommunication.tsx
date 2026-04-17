import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminNavBar } from '@/components/admin/admin-navbar';
import { Dock } from '@/components/ui/dock';
import { Home, Calendar, Users, Settings, MessageSquare, Radio, Hash, Megaphone, Send } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', url: '/admin-dashboard', icon: Home },
  { name: 'Events', url: '/admin-events', icon: Calendar },
  { name: 'Communication', url: '/admin-communication', icon: MessageSquare },
  { name: 'Team', url: '/admin-team', icon: Users },
  { name: 'Settings', url: '/admin-settings', icon: Settings },
];

const DOCK_ITEMS = [
  { icon: <Home size={20} />, label: 'Dashboard', href: '/admin-dashboard' },
  { icon: <Calendar size={20} />, label: 'Events', href: '/admin-events' },
  { icon: <MessageSquare size={20} />, label: 'Comms', href: '/admin-communication' },
  { icon: <Users size={20} />, label: 'Team', href: '/admin-team' },
  { icon: <Settings size={20} />, label: 'Settings', href: '/admin-settings' },
];

type Tab = 'broadcasts' | 'channels';

function getAdminEmailFromSession(): string | undefined {
  try {
    const adminSession = sessionStorage.getItem('adminUser');
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      return parsed?.email;
    }
  } catch {}
  return undefined;
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all cursor-pointer ${
        active
          ? 'bg-[#6D28D9] text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]'
          : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      {label}
    </button>
  );
}

function BroadcastsSidebar() {
  const channels = ['General', 'Announcements', 'Urgent'];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        Channels
      </p>
      {channels.map((ch, i) => (
        <motion.button
          key={ch}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:bg-[#6D28D9] hover:text-white transition-colors cursor-pointer flex items-center gap-2"
        >
          <Megaphone size={14} />
          {ch}
        </motion.button>
      ))}
    </div>
  );
}

function EventChannelsSidebar({ selectedEventId, onSelectEvent }: { selectedEventId: Id<"events"> | null; onSelectEvent: (id: Id<"events">) => void }) {
  const events = useQuery(api.communication.getActiveEventsForChannels);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        Event Channels
      </p>
      {events === undefined ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 px-2">No active events</p>
      ) : (
        events.map((ev, i) => (
          <motion.button
            key={ev._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectEvent(ev._id)}
            className={`w-full text-left px-4 py-3 border-2 border-black dark:border-white text-sm font-bold uppercase tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
              selectedEventId === ev._id
                ? 'bg-[#6D28D9] text-white'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-[#6D28D9] hover:text-white'
            }`}
          >
            <Hash size={14} />
            <span className="truncate">{ev.name}</span>
          </motion.button>
        ))
      )}
    </div>
  );
}

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

const REACTION_EMOJIS = ['👍', '🔥', '❤️', '😂', '🎉', '👀'];

function highlightMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      return (
        <span key={i} className="text-[#6D28D9] font-bold">
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function MessageCard({ message, index }: { message: any; index: number }) {
  const { user } = useAuth();
  const toggleReaction = useMutation(api.communication.toggleEmojiReaction);
  const [showPicker, setShowPicker] = useState(false);

  const initials = (message.authorName || 'U')
    .split(' ')
    .map((w: string) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const reactionGroups: Record<string, { count: number; hasReacted: boolean }> = {};
  (message.reactions || []).forEach((r: any) => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { count: 0, hasReacted: false };
    }
    reactionGroups[r.emoji].count++;
    if (user && r.userId === user._id) {
      reactionGroups[r.emoji].hasReacted = true;
    }
  });

  const handleReaction = async (emoji: string) => {
    try {
      await toggleReaction({ messageId: message._id, emoji });
    } catch (e: any) {
      toast.error(e.message || 'Failed to react');
    }
    setShowPicker(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex-shrink-0 border-2 border-black dark:border-white rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
          {message.authorImage ? (
            <img src={message.authorImage} alt={message.authorName || 'User'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black text-xs font-black">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black uppercase tracking-wide text-black dark:text-white">
              {message.authorName || 'Unknown'}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
              {formatTimestamp(message._creationTime)}
            </span>
          </div>
          <p className="text-sm text-black dark:text-white leading-relaxed whitespace-pre-wrap break-words">
            {highlightMentions(message.content)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`inline-flex items-center gap-1 border border-black dark:border-white px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  data.hasReacted
                    ? 'bg-[#6D28D9]/20 border-[#6D28D9] text-black dark:text-white'
                    : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{emoji}</span>
                <span>{data.count}</span>
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="inline-flex items-center border border-black/30 dark:border-white/30 px-2 py-1 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors cursor-pointer"
              >
                +
              </button>
              {showPicker && (
                <div className="absolute bottom-full left-0 mb-1 z-10 flex gap-1 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-1.5 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EventChannelMessageCard({ message, index }: { message: any; index: number }) {
  const { user } = useAuth();
  const toggleReaction = useMutation(api.communication.toggleEventChannelReaction);
  const [showPicker, setShowPicker] = useState(false);

  const initials = (message.authorName || 'U')
    .split(' ')
    .map((w: string) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const reactionGroups: Record<string, { count: number; hasReacted: boolean }> = {};
  (message.reactions || []).forEach((r: any) => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { count: 0, hasReacted: false };
    }
    reactionGroups[r.emoji].count++;
    const currentUserId = user?._id;
    const adminEmail = getAdminEmailFromSession();
    if (currentUserId && r.userId === currentUserId) {
      reactionGroups[r.emoji].hasReacted = true;
    }
  });

  const handleReaction = async (emoji: string) => {
    try {
      const adminEmail = getAdminEmailFromSession();
      await toggleReaction({ messageId: message._id, emoji, adminEmail });
    } catch (e: any) {
      toast.error(e.message || 'Failed to react');
    }
    setShowPicker(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex-shrink-0 border-2 border-black dark:border-white rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
          <div className="w-full h-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black text-xs font-black">
            {initials}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black uppercase tracking-wide text-black dark:text-white">
              {message.authorName || 'Unknown'}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
              {formatTimestamp(message._creationTime)}
            </span>
          </div>
          <p className="text-sm text-black dark:text-white leading-relaxed whitespace-pre-wrap break-words">
            {highlightMentions(message.content)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`inline-flex items-center gap-1 border border-black dark:border-white px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  data.hasReacted
                    ? 'bg-[#6D28D9]/20 border-[#6D28D9] text-black dark:text-white'
                    : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{emoji}</span>
                <span>{data.count}</span>
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="inline-flex items-center border border-black/30 dark:border-white/30 px-2 py-1 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors cursor-pointer"
              >
                +
              </button>
              {showPicker && (
                <div className="absolute bottom-full left-0 mb-1 z-10 flex gap-1 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 p-1.5 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BroadcastsContent() {
  const { user } = useAuth();
  const messages = useQuery(api.communication.listMessages);
  const sendMessage = useMutation(api.communication.postMessage);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = (() => {
    if (user?.role === 'admin') return true;
    try {
      const adminSession = sessionStorage.getItem('adminUser');
      if (adminSession) return true;
    } catch {}
    return false;
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const adminEmail = getAdminEmailFromSession();
      await sendMessage({ content: trimmed, adminEmail });
      setContent('');
      toast.success('Broadcast sent!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      <div className="mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
          Broadcast
        </h2>
      </div>
      {isAdmin ? (
        <div className="mb-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a broadcast message..."
            rows={3}
            className="w-full border-2 border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-800 px-4 py-3 text-sm font-bold text-black dark:text-white outline-none resize-none focus:shadow-[3px_3px_0px_0px_#6D28D9] transition-shadow placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="mt-2 flex items-center justify-center gap-2 w-full bg-[#6D28D9] border-2 border-black dark:border-white text-white font-black uppercase tracking-wide text-sm py-3 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
        </div>
      ) : (
        <div className="mb-5 border-2 border-black/30 dark:border-white/30 bg-neutral-100 dark:bg-neutral-800 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Team members can view broadcasts but cannot send
          </p>
        </div>
      )}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
        {messages === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 border-[3px] border-black dark:border-white bg-[#6D28D9]/10 flex items-center justify-center">
              <Radio size={28} className="text-[#6D28D9]" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              No broadcasts yet
            </p>
          </div>
        ) : (
          messages.map((msg: any, i: number) => (
            <MessageCard key={msg._id} message={msg} index={i} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  );
}

function EventChannelsContent({ selectedEventId }: { selectedEventId: Id<"events"> | null }) {
  const { user } = useAuth();
  const messages = useQuery(
    api.communication.listEventChannelMessages,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );
  const postMessage = useMutation(api.communication.postEventChannelMessage);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdminOrTeam = (() => {
    if (user?.role === 'admin') return true;
    try {
      const adminSession = sessionStorage.getItem('adminUser');
      if (adminSession) return true;
    } catch {}
    return false;
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const handleSend = async () => {
    if (!selectedEventId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const adminEmail = getAdminEmailFromSession();
      await postMessage({ eventId: selectedEventId, content: trimmed, adminEmail });
      setContent('');
      toast.success('Message sent!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedEventId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col items-center justify-center gap-4 py-16"
      >
        <div className="w-20 h-20 border-[3px] border-black dark:border-white bg-[#6D28D9]/10 flex items-center justify-center">
          <Hash size={36} className="text-[#6D28D9]" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
          Event Channels
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
          Select an event channel from the sidebar to start communicating.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={selectedEventId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      <div className="mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
          Event Chat
        </h2>
      </div>

      {/* Compose box */}
      {isAdminOrTeam ? (
        <div className="mb-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message to this event channel..."
            rows={3}
            className="w-full border-2 border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-800 px-4 py-3 text-sm font-bold text-black dark:text-white outline-none resize-none focus:shadow-[3px_3px_0px_0px_#6D28D9] transition-shadow placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="mt-2 flex items-center justify-center gap-2 w-full bg-[#6D28D9] border-2 border-black dark:border-white text-white font-black uppercase tracking-wide text-sm py-3 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      ) : (
        <div className="mb-5 border-2 border-black/30 dark:border-white/30 bg-neutral-100 dark:bg-neutral-800 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Participants can react to messages but cannot post
          </p>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
        {messages === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 border-[3px] border-black dark:border-white bg-[#6D28D9]/10 flex items-center justify-center">
              <Hash size={28} className="text-[#6D28D9]" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              No messages yet in this channel
            </p>
          </div>
        ) : (
          messages.map((msg: any, i: number) => (
            <EventChannelMessageCard key={msg._id} message={msg} index={i} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  );
}

export default function AdminCommunication() {
  const [activeTab, setActiveTab] = useState<Tab>('broadcasts');
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);

  return (
    <div className="min-h-screen bg-[#FDF8F3] dark:bg-neutral-950 flex flex-col">
      <AdminNavBar items={ADMIN_NAV_ITEMS} />
      <div className="flex-1 pt-20 pb-28 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white mb-6"
        >
          Communication
        </motion.h1>
        <div className="flex gap-2 mb-6">
          <TabButton label="Broadcasts" active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} />
          <TabButton label="Event Channels" active={activeTab === 'channels'} onClick={() => setActiveTab('channels')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-[#FDF8F3] dark:bg-neutral-900 p-4"
          >
            {activeTab === 'broadcasts' ? (
              <BroadcastsSidebar />
            ) : (
              <EventChannelsSidebar selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
            )}
          </motion.div>
          <div className="border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-6 min-h-[400px] flex">
            {activeTab === 'broadcasts' ? (
              <BroadcastsContent />
            ) : (
              <EventChannelsContent selectedEventId={selectedEventId} />
            )}
          </div>
        </div>
      </div>
      <Dock items={DOCK_ITEMS} className="!top-auto !bottom-4" />
    </div>
  );
}