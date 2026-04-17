import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Send, Loader2, Clock, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface TicketsListPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isOpen = status === "open";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 ${
        isOpen
          ? "border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          : "border-neutral-400 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
      }`}
    >
      {isOpen ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: {
    _id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    createdAt: number;
  };
  onClose: () => void;
}) {
  const { user } = useAuth();
  const replies = useQuery(api.tickets.getTicketReplies, { ticketId: ticket._id });
  const addReply = useMutation(api.tickets.addReply);
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return;
    setIsSending(true);
    try {
      const result = await addReply({
        ticketId: ticket._id,
        authorId: user._id,
        authorName: user.name || user.email || "User",
        content: replyContent.trim(),
      });
      if (result.success) {
        setReplyContent("");
        toast.success("Reply sent!");
      } else {
        toast.error(result.message || "Failed to send reply");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reply";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-black uppercase tracking-wider truncate">
              Ticket Details
            </span>
          </div>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Ticket Info */}
          <div>
            <h3 className="text-lg font-black uppercase text-black dark:text-white mb-2">
              {ticket.subject}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <StatusBadge status={ticket.status} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-2 border-black/20 dark:border-white/20 px-2 py-0.5">
                {ticket.category}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                {formatDate(ticket.createdAt)}
              </span>
            </div>
            <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-4">
              <p className="text-sm text-black dark:text-white whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Replies */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              Replies ({replies?.length || 0})
            </p>
            {replies === undefined ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : replies.length === 0 ? (
              <div className="border-2 border-dashed border-black/30 dark:border-white/30 p-4 text-center">
                <p className="text-xs text-muted-foreground">No replies yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((reply: { _id: string; authorName: string; content: string; createdAt: number }) => (
                  <motion.div
                    key={reply._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
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
          </div>
        </div>

        {/* Reply Input */}
        {ticket.status === "open" && (
          <div className="border-t-2 border-black dark:border-white p-4 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Type a reply..."
                disabled={isSending}
                className="flex-1 border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              <button
                onClick={handleSendReply}
                disabled={isSending || !replyContent.trim()}
                className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-3 py-2 font-black uppercase text-xs shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function TicketsListPanel({ isOpen, onClose, onCreateNew }: TicketsListPanelProps) {
  const { user } = useAuth();
  const tickets = useQuery(
    api.tickets.getUserTickets,
    user?._id ? { userId: user._id } : "skip"
  );
  const [selectedTicket, setSelectedTicket] = useState<{
    _id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    createdAt: number;
  } | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-black uppercase tracking-wider">My Tickets</span>
              </div>
              <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Create New Button */}
              <button
                onClick={() => {
                  onClose();
                  setTimeout(onCreateNew, 200);
                }}
                className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-dashed border-black dark:border-white text-black dark:text-white px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-[#f5f0e8] dark:hover:bg-neutral-800 transition-colors"
              >
                + New Ticket
              </button>

              {/* Tickets List */}
              {tickets === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-6 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    No tickets yet
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Create a ticket if you need help
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket: {
                    _id: string;
                    subject: string;
                    description: string;
                    category: string;
                    status: string;
                    priority: string;
                    createdAt: number;
                  }) => (
                    <motion.button
                      key={ticket._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full text-left border-2 border-black dark:border-white bg-white dark:bg-neutral-800 p-4 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-black uppercase text-black dark:text-white leading-tight">
                          {ticket.subject}
                        </h4>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-black/20 dark:border-white/20 px-1.5 py-0.5">
                          {ticket.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Ticket Detail Modal */}
          <AnimatePresence>
            {selectedTicket && (
              <TicketDetailModal
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
