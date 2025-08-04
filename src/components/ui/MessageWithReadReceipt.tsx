import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface Message {
  _id: Id<"admin_communication_messages">;
  senderId: Id<"users">;
  senderName: string;
  timestamp: number;
  messageText: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "pdf";
  emojiReactions: Array<{ emoji: string; userId: Id<"users">; timestamp: number }>;
  readBy: Array<{ userId: Id<"users">; readAt: number }>;
}

interface MessageWithReadReceiptProps {
  message: Message;
  currentUserId: Id<"users"> | undefined;
  onEmojiReaction: (messageId: Id<"admin_communication_messages">, emoji: string) => void;
}

const MessageWithReadReceipt: React.FC<MessageWithReadReceiptProps> = ({ message, currentUserId, onEmojiReaction }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const markAsRead = useMutation(api.communication.markAsRead);

  useEffect(() => {
    if (inView && currentUserId && message.senderId !== currentUserId) {
      const hasRead = message.readBy?.some(receipt => receipt.userId === currentUserId);
      if (!hasRead) {
        markAsRead({ messageId: message._id });
      }
    }
  }, [inView, currentUserId, message, markAsRead]);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEmojiCounts = (reactions: Array<{ emoji: string; userId: Id<"users">; timestamp: number }>) => {
    const counts: Record<string, { count: number; userIds: Id<"users">[] }> = {};
    
    reactions.forEach(reaction => {
      if (!counts[reaction.emoji]) {
        counts[reaction.emoji] = { count: 0, userIds: [] };
      }
      counts[reaction.emoji].count++;
      counts[reaction.emoji].userIds.push(reaction.userId);
    });
    
    return counts;
  };

  const hasUserReacted = (reactions: Array<{ emoji: string; userId: Id<"users">; timestamp: number }>, emoji: string, userId: Id<"users"> | undefined) => {
    if (!userId) return false;
    return reactions.some(reaction => reaction.emoji === emoji && reaction.userId === userId);
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
  const emojiCounts = getEmojiCounts(message.emojiReactions || []);

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-4"
    >
      {/* Message Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 font-bold text-sm uppercase tracking-wide">
          {message.senderName}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      
      {/* Message Content */}
      {message.messageText && (
        <div className="text-base leading-relaxed mb-3 font-mono">
          {message.messageText}
        </div>
      )}

      {/* Attachment Preview */}
      {message.attachmentUrl && (
        <div className="mt-3 border-4 border-gray-300 dark:border-gray-600 p-3">
          {message.attachmentType === 'image' ? (
            <img 
              src={message.attachmentUrl} 
              alt="Attachment" 
              className="max-w-full h-auto max-h-64 object-contain border-2 border-black dark:border-white"
            />
          ) : message.attachmentType === 'pdf' ? (
            <div className="flex items-center gap-3 p-3 bg-red-100 dark:bg-red-900 border-2 border-red-500">
              <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <div className="font-bold text-sm uppercase">PDF DOCUMENT</div>
                <a 
                  href={message.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 underline font-bold flex items-center gap-1 mt-1"
                >
                  <Download className="h-4 w-4" />
                  DOWNLOAD PDF
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-400">
              <FileText className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <div className="font-bold text-sm uppercase">FILE ATTACHMENT</div>
                <a 
                  href={message.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline font-bold flex items-center gap-1 mt-1"
                >
                  <Download className="h-4 w-4" />
                  DOWNLOAD FILE
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emoji Reactions */}
      <div className="mt-4 pt-3 border-t-2 border-gray-200 dark:border-gray-700">
        {/* Existing Reactions */}
        {Object.keys(emojiCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(emojiCounts).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onEmojiReaction(message._id, emoji)}
                className={`flex items-center gap-1 px-2 py-1 border-2 font-bold text-sm transition-colors ${
                  hasUserReacted(message.emojiReactions || [], emoji, currentUserId)
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs">{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Add Reaction Buttons */}
        <div className="flex flex-wrap gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiReaction(message._id, emoji)}
              className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Read Receipts */}
      {currentUserId === message.senderId && message.readBy && message.readBy.length > 0 && (
        <div className="mt-3 pt-2 border-t-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">Read by:</span>
            <div className="flex -space-x-2">
              {message.readBy.slice(0, 5).map((receipt, index) => (
                <div key={index} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-black flex items-center justify-center text-xs font-bold">
                  {/* Placeholder for avatar - using initial */}
                  U
                </div>
              ))}
            </div>
            {message.readBy.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                + {message.readBy.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageWithReadReceipt;