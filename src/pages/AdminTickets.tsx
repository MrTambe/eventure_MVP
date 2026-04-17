/* eslint-disable */
// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  Users,
  Settings,
  Ticket,
  MessageSquare,
  Loader2,
  X,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { MenuBar } from '@/components/ui/glow-menu';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { ThemeProvider } from 'next-themes';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { getAdminSession, isAdminRole } from '@/hooks/use-admin-session';
import { Id } from '@/convex/_generated/dataModel';

type StatusFilter = 'all' | 'open' | 'closed';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-200 text-blue-900 border-blue-400',
  medium: 'bg-yellow-200 text-yellow-900 border-yellow-400',
  high: 'bg-orange-200 text-orange-900 border-orange-400',
  urgent: 'bg-red-300 text-red-900 border-red-500',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-300 text-green-900 border-green-500',
  closed: 'bg-neutral-300 text-neutral-700 border-neutral-500',
};

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: any;
  onClose: () => void;
}) {
  const replies = useQuery(api.tickets.getTicketReplies, { ticketId: ticket._id });
  const addReply = useMutation(api.tickets.addReply);
  const closeTicket = useMutation(api.tickets.closeTicket);
  const updatePriority = useMutation(api.tickets.updateTicketPriority);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminSession = getAdminSession();
  const isAdmin = adminSession?.role === 'admin';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies?.length]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !adminSession) return;
    setSending(true);
    try {
      await addReply({
        ticketId: ticket._id,
        authorId: adminSession._id,
        authorName: adminSession.name || adminSession.email || 'Admin',
        content: replyContent.trim(),
      });
      setReplyContent('');
      toast.success('Reply sent');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const result = await closeTicket({ ticketId: ticket._id as Id<"tickets"> });
      if (result.success) {
        toast.success('Ticket closed');
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updatePriority({ ticketId: ticket._id as Id<"tickets">, priority: newPriority });
      toast.success(`Priority updated to ${newPriority}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update priority');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="text-sm font-black uppercase tracking-wider">Ticket Detail</span>
          </div>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Ticket Info */}
          <div>
            <h2 className="text-xl font-black uppercase text-black dark:text-white mb-2">
              {ticket.subject}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                {ticket.status}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium}`}>
                {ticket.priority}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-black/20 dark:border-white/20 px-1.5 py-0.5">
                {ticket.category}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDate(ticket.createdAt)}
              </span>
            </div>

            {/* Admin controls */}
            {isAdmin && ticket.status !== 'closed' && (
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="border-2 border-black dark:border-white bg-background text-foreground text-xs font-mono px-2 py-1 cursor-pointer focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="flex items-center gap-1 border-2 border-black dark:border-white bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 text-xs font-black uppercase hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                >
                  {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  Close Ticket
                </button>
              </div>
            )}

            <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Description</p>
              <p className="text-sm text-black dark:text-white whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Replies */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
              Replies ({replies?.length || 0})
            </p>
            {replies === undefined ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : replies.length === 0 ? (
              <div className="border-2 border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">No replies yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((reply: any, i: number) => (
                  <motion.div
                    key={reply._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-2 border-black dark:border-white bg-white dark:bg-neutral-800 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase text-black dark:text-white">
                        {reply.authorName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-black dark:text-white whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Input */}
        {ticket.status !== 'closed' && (
          <div className="border-t-2 border-black dark:border-white p-4 flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="flex-1 border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={sending || !replyContent.trim()}
                className="self-end bg-black dark:bg-white text-white dark:text-black px-4 py-2 border-2 border-black dark:border-white font-black uppercase text-xs shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function AdminTicketsContent() {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('Tickets');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const allTickets = useQuery(api.tickets.listAllTickets);
  const adminSession = getAdminSession();
  const isAdmin = adminSession?.role === 'admin';

  const filteredTickets = allTickets
    ? statusFilter === 'all'
      ? allTickets
      : allTickets.filter((t: any) => t.status === statusFilter)
    : undefined;

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Tickets', label: 'Tickets', href: '/admin-tickets', icon: Ticket, gradient: 'from-amber-500 to-yellow-500', iconColor: 'text-amber-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' },
  ];

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    const routes: Record<string, string> = {
      Dashboard: '/admin-dashboard',
      Events: '/admin-events',
      Tickets: '/admin-tickets',
      Team: '/admin-team',
      Settings: '/admin-settings',
    };
    if (routes[itemName]) navigate(routes[itemName]);
  };

  const openCount = allTickets?.filter((t: any) => t.status === 'open').length || 0;
  const closedCount = allTickets?.filter((t: any) => t.status === 'closed').length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
        <header className="border-b-2 border-black dark:border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">SUPPORT TICKETS</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border-2 border-black dark:border-white px-3 py-1 bg-green-200 dark:bg-green-900/30">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-black">{openCount} OPEN</span>
              </div>
              <div className="flex items-center gap-2 border-2 border-black dark:border-white px-3 py-1 bg-neutral-200 dark:bg-neutral-800">
                <CheckCircle className="h-3 w-3" />
                <span className="text-xs font-black">{closedCount} CLOSED</span>
              </div>
            </div>
          </div>
        </header>

        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        </div>

        <div className="container mx-auto px-4 py-8 pt-20">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'open', 'closed'] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all ${
                  statusFilter === filter
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-[4px_4px_0px_#555] dark:shadow-[4px_4px_0px_#aaa]'
                    : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {filter === 'all' ? `All (${allTickets?.length || 0})` : filter === 'open' ? `Open (${openCount})` : `Closed (${closedCount})`}
              </button>
            ))}
          </div>

          {/* Tickets List */}
          {filteredTickets === undefined ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm p-8 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2 tracking-tighter">NO TICKETS FOUND</h3>
              <p className="text-lg font-medium text-muted-foreground">
                {statusFilter === 'all' ? 'No support tickets have been submitted yet.' : `No ${statusFilter} tickets.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket: any, i: number) => (
                <motion.div
                  key={ticket._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className="cursor-pointer border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#fff] transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-sm font-black uppercase text-black dark:text-white leading-tight flex-1">
                        {ticket.subject}
                      </h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border flex-shrink-0 ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 border ${PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-black/20 dark:border-white/20 px-1.5 py-0.5">
                        {ticket.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail Modal */}
        <AnimatePresence>
          {selectedTicket && (
            <TicketDetailModal
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminTickets() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminTicketsContent />
    </ThemeProvider>
  );
}
