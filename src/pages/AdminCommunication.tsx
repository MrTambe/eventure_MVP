import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminNavBar } from '@/components/admin/admin-navbar';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { MentionAutocomplete } from '@/components/ui/MentionAutocomplete';
import { Home, Calendar, Users, Settings, MessageSquare, Radio, Hash, Megaphone, Send, Ticket, ScanLine, BarChart3, Trash2, Plus } from 'lucide-react';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { friendlyErrorMessage } from '@/lib/friendly-error';

import { ADMIN_NAV_ITEMS } from '@/components/admin/admin-nav-items';

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

type BroadcastChannel = "general" | "announcements" | "urgent";

const BROADCAST_CHANNELS: { key: BroadcastChannel; label: string }[] = [
  { key: "general", label: "General" },
  { key: "announcements", label: "Announcements" },
  { key: "urgent", label: "Urgent" },
];

function BroadcastsSidebar({ selectedChannel, onSelectChannel }: { selectedChannel: BroadcastChannel; onSelectChannel: (ch: BroadcastChannel) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        Channels
      </p>
      {BROADCAST_CHANNELS.map((ch, i) => (
        <motion.button
          key={ch.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectChannel(ch.key)}
          className={`w-full text-left px-4 py-3 border-2 border-black dark:border-white text-sm font-bold uppercase tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
            selectedChannel === ch.key
              ? 'bg-[#6D28D9] text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]'
              : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-[#6D28D9] hover:text-white'
          }`}
        >
          <Megaphone size={14} />
          {ch.label}
        </motion.button>
      ))}
    </div>
  );
}

function EventChannelsSidebar({ selectedEventId, onSelectEvent, isAdminOrTeam }: { selectedEventId: Id<"events"> | null; onSelectEvent: (id: Id<"events">, chatId: any) => void; isAdminOrTeam: boolean }) {
  const events = useQuery(api.communication.getActiveEventsForChannels);
  const chats = useQuery(api.communication.getEventChats);
  const createChat = useMutation(api.communication.createEventChat);
  const deleteChat = useMutation(api.communication.deleteEventChat);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [creatingFor, setCreatingFor] = useState<Id<"events"> | null>(null);

  const handleCreate = async (eventId: Id<"events">) => {
    const title = newChatTitle.trim() || 'Event Chat';
    try {
      const result = await createChat({ eventId, title, adminEmail: getAdminEmailFromSession() });
      if (result?.success) {
        toast.success('Chat created!');
        setNewChatTitle('');
        setCreatingFor(null);
      } else {
        toast.error(result?.message || 'Could not create chat');
      }
    } catch (e: any) {
      toast.error(friendlyErrorMessage(e, "Couldn't create the chat. Please try again."));
    }
  };

  const handleDelete = async (chatId: any) => {
    if (!confirm('Delete this chat and all its messages? This cannot be undone.')) return;
    try {
      const result = await deleteChat({ chatId, adminEmail: getAdminEmailFromSession() });
      if (result?.success) {
        toast.success('Chat deleted');
      } else {
        toast.error(result?.message || 'Could not delete chat');
      }
    } catch (e: any) {
      toast.error(friendlyErrorMessage(e, "Couldn't delete the chat. Please try again."));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        Event Chats
      </p>
      {events === undefined || chats === undefined ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 px-2">No active events</p>
      ) : (
        events.map((ev: any) => {
          const eventChats = chats.filter((c: any) => c.eventId === ev._id);
          return (
            <div key={ev._id} className="flex flex-col gap-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 px-2 pt-1 truncate">
                {ev.name}
              </p>
              {eventChats.length === 0 && (
                <p className="text-[10px] text-neutral-400 px-3 italic">No chats</p>
              )}
              {eventChats.map((chat: any) => (
                <div key={chat._id} className="flex items-stretch group">
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onSelectEvent(chat.eventId, chat._id)}
                    className={`flex-1 min-w-0 text-left px-3 py-2.5 border-2 border-black dark:border-white text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
                      selectedEventId === chat.eventId
                        ? 'bg-[#6D28D9] text-white'
                        : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-[#6D28D9] hover:text-white'
                    }`}
                  >
                    <Hash size={12} className="flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                    <span className="ml-auto text-[9px] opacity-60">{chat.messageCount}</span>
                  </motion.button>
                  {isAdminOrTeam && (
                    <button
                      onClick={() => handleDelete(chat._id)}
                      className="px-2 border-2 border-l-0 border-black dark:border-white bg-white dark:bg-neutral-900 text-neutral-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                      title={`Delete "${chat.title}"`}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {isAdminOrTeam && (
                creatingFor === ev._id ? (
                  <div className="flex gap-1 px-1 py-1">
                    <input
                      value={newChatTitle}
                      onChange={(e) => setNewChatTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate(ev._id);
                        if (e.key === 'Escape') setCreatingFor(null);
                      }}
                      autoFocus
                      placeholder="Chat name..."
                      className="flex-1 min-w-0 border-2 border-black dark:border-white px-2 py-1 text-[11px] font-bold outline-none"
                    />
                    <button
                      onClick={() => handleCreate(ev._id)}
                      className="px-2 bg-[#6D28D9] text-white border-2 border-black dark:border-white cursor-pointer"
                      title="Create"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreatingFor(ev._id)}
                    className="mx-1 mt-0.5 px-2 py-1 border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-[10px] font-bold uppercase tracking-wide text-neutral-400 hover:border-[#6D28D9] hover:text-[#6D28D9] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={10} /> New chat
                  </button>
                )
              )}
            </div>
          );
        })
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
      toast.error(friendlyErrorMessage(e, "Couldn't add your reaction. Please try again."));
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
      toast.error(friendlyErrorMessage(e, "Couldn't add your reaction. Please try again."));
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

function BroadcastsContent({ selectedChannel }: { selectedChannel: BroadcastChannel }) {
  const { user } = useAuth();
  const messages = useQuery(api.communication.listMessages, { channel: selectedChannel });
  const sendMessage = useMutation(api.communication.postMessage);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = (() => {
    if (user?.role === 'admin') return true;
    try {
      const adminSession = sessionStorage.getItem('adminUser');
      if (adminSession) {
        const parsed = JSON.parse(adminSession);
        return parsed?.role === 'admin';
      }
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
      await sendMessage({ content: trimmed, adminEmail, channel: selectedChannel });
      setContent('');
      toast.success('Broadcast sent!');
    } catch (e: any) {
      toast.error(friendlyErrorMessage(e, "Couldn't send the broadcast. Please try again."));
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
          {selectedChannel === 'general' ? 'General' : selectedChannel === 'announcements' ? 'Announcements' : 'Urgent'} Broadcast
        </h2>
      </div>
      {isAdmin ? (
        <div className="mb-5">
          <MentionAutocomplete
            value={content}
            onChange={setContent}
            onKeyDown={handleKeyDown}
            placeholder="Write a broadcast message... Use @ to mention"
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

function EventChannelsContent({ selectedEventId, chatId }: { selectedEventId: Id<"events"> | null; chatId: Id<"event_chats"> | null }) {
  const { user } = useAuth();
  const messages = useQuery(
    api.communication.listEventChannelMessages,
    selectedEventId ? { eventId: selectedEventId, chatId: chatId ?? undefined } : "skip"
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
      await postMessage({ eventId: selectedEventId, content: trimmed, adminEmail, chatId: chatId ?? undefined });
      setContent('');
      toast.success('Message sent!');
    } catch (e: any) {
      toast.error(friendlyErrorMessage(e, "Couldn't send the message. Please try again."));
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
          <MentionAutocomplete
            value={content}
            onChange={setContent}
            onKeyDown={handleKeyDown}
            placeholder="Write a message... Use @ to mention"
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
  const [selectedChatId, setSelectedChatId] = useState<Id<"event_chats"> | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel>('general');

  const isAdminOrTeam = (() => {
    if (useAuth().user?.role === 'admin') return true;
    try {
      const adminSession = sessionStorage.getItem('adminUser');
      if (adminSession) return true;
    } catch {}
    return false;
  })();

  // Get recipient ID for notifications (from Convex auth or admin session)
  const { user } = useAuth();
  const recipientId = (() => {
    if (user?._id) return user._id;
    try {
      const adminSession = sessionStorage.getItem('adminUser');
      if (adminSession) {
        const parsed = JSON.parse(adminSession);
        return parsed?._id;
      }
    } catch {}
    return undefined;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
      <AdminNavBar items={ADMIN_NAV_ITEMS} />
      <div className="flex-1 pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white"
          >
            Communication
          </motion.h1>
          <NotificationBell recipientId={recipientId} />
        </div>
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
              <BroadcastsSidebar selectedChannel={selectedChannel} onSelectChannel={setSelectedChannel} />
            ) : (
              <EventChannelsSidebar
                selectedEventId={selectedEventId}
                onSelectEvent={(id, chatId) => {
                  setSelectedEventId(id);
                  setSelectedChatId(chatId);
                }}
                isAdminOrTeam={isAdminOrTeam}
              />
            )}
          </motion.div>
          <div className="border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-6 min-h-[400px] flex">
            {activeTab === 'broadcasts' ? (
              <BroadcastsContent selectedChannel={selectedChannel} />
            ) : (
              <EventChannelsContent selectedEventId={selectedEventId} chatId={selectedChatId} />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}