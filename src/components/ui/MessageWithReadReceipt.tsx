import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "./button";
import { FileText, Download, Play, ImageIcon, FileIcon, AlertCircle, Plus } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

interface Message {
  _id: Id<"admin_communication_messages">;
  _creationTime: number;
  messageText: string;
  senderId: Id<"users"> | Id<"admins">;
  senderName: string;
  timestamp: number;
  attachments: Array<{
    url: string;
    name: string;
    type: "image" | "pdf" | "video" | "docx" | "other";
  }>;
  reactions?: Record<string, Id<"users">[]>;
  readBy?: Id<"users">[];
}

interface MessageWithReadReceiptProps {
  message: Message;
  onEmojiReaction: (messageId: Id<"admin_communication_messages">, emoji: string) => void;
}

const MessageWithReadReceipt: React.FC<MessageWithReadReceiptProps> = ({
  message,
  onEmojiReaction,
}) => {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionTooltip, setShowReactionTooltip] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  const markAsRead = useMutation(api.communication.markAsRead);
  const teamMemberCount = useQuery(api.communication.getTeamMemberCount);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  // Mark message as read when it comes into view
  useEffect(() => {
    if (inView && user && message.senderId !== user._id) {
      const readBy = message.readBy || [];
      if (!readBy.includes(user._id)) {
        markAsRead({ messageId: message._id });
      }
    }
  }, [inView, user, message._id, message.senderId, message.readBy, markAsRead]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleImageError = (url: string) => {
    setImageLoadErrors(prev => new Set(prev).add(url));
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div key={index} className="border-2 border-black dark:border-white p-2 rounded">
            {attachment.type === "image" && !imageLoadErrors.has(attachment.url) ? (
              <div className="space-y-2">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-full max-h-[300px] object-contain cursor-pointer border border-gray-300 rounded"
                  onClick={() => setShowImageModal(attachment.url)}
                  onError={() => handleImageError(attachment.url)}
                />
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{attachment.name}</p>
              </div>
            ) : attachment.type === "video" ? (
              <div className="space-y-2">
                <video
                  src={attachment.url}
                  controls
                  className="max-w-full max-h-[300px] border border-gray-300 rounded"
                >
                  Your browser does not support the video tag.
                </video>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{attachment.name}</p>
              </div>
            ) : attachment.type === "pdf" ? (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => window.open(attachment.url, '_blank')}>
                <FileText className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-mono font-bold">{attachment.name}</p>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400">PDF Document</p>
                </div>
                <Download className="h-4 w-4 text-gray-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => window.open(attachment.url, '_blank')}>
                <FileIcon className="h-6 w-6 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-mono font-bold">{attachment.name}</p>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {attachment.type === "docx" ? "Word Document" : "File"}
                  </p>
                </div>
                <Download className="h-4 w-4 text-gray-500" />
              </div>
            )}
            
            {imageLoadErrors.has(attachment.url) && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm font-mono text-red-600 dark:text-red-400">File could not be previewed</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getEmojiCounts = () => {
    const counts = new Map<string, { count: number; hasCurrentUser: boolean }>();
    if (!message.reactions) return counts;

    for (const [emoji, userIds] of Object.entries(message.reactions)) {
      counts.set(emoji, {
        count: userIds.length,
        hasCurrentUser: !!(user && userIds.includes(user._id)),
      });
    }
    return counts;
  };

  const handleEmojiSelect = (emojiData: any) => {
    onEmojiReaction(message._id, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleQuickReaction = (emoji: string) => {
    onEmojiReaction(message._id, emoji);
  };

  const renderReadReceipts = () => {
    // Only show read receipts for messages sent by the current user (admin)
    if (!user || message.senderId !== user._id || !teamMemberCount) return null;

    const readBy = message.readBy || [];
    const readCount = readBy.length;
    const totalCount = teamMemberCount - 1; // Exclude the sender

    if (totalCount <= 0) return null;

    const allRead = readCount >= totalCount;

    return (
      <div className="mt-2 flex justify-end">
        <div className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
          {allRead ? (
            <span className="flex items-center gap-1">
              ✅ <span>All seen</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              👁️ <span>{readCount}/{totalCount} seen</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  const emojiCounts = getEmojiCounts();
  const hasReactions = emojiCounts.size > 0;

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-4 relative"
    >
      {/* Message Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm">
            {message.senderName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-sm font-mono tracking-tight uppercase">
              {message.senderName}
            </span>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
        
        {/* Add Reaction Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute top-10 right-0 z-50">
              <EmojiPicker onEmojiClick={handleEmojiSelect} />
            </div>
          )}
        </div>
      </div>

      {/* Message Content */}
      {message.messageText && (
        <div className="mb-3">
          <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
            {message.messageText}
          </p>
        </div>
      )}

      {/* Enhanced Attachment Previews */}
      {renderAttachments()}

      {/* Emoji Reactions Bar */}
      {hasReactions && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(emojiCounts.entries()).map(([emoji, data]) => (
            <div
              key={emoji}
              className="relative"
              onMouseEnter={() => setShowReactionTooltip(emoji)}
              onMouseLeave={() => setShowReactionTooltip(null)}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickReaction(emoji)}
                className={`h-8 px-2 text-xs font-mono border-2 transition-all ${
                  data.hasCurrentUser
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-1">{emoji}</span>
                <span className="font-bold">{data.count}</span>
              </Button>
              
              {/* Reaction Tooltip */}
              {showReactionTooltip === emoji && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                  <div className="bg-black dark:bg-white text-white dark:text-black text-xs font-mono p-2 rounded border-2 border-black dark:border-white whitespace-nowrap">
                    <div className="font-bold mb-1">{emoji} {data.count}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Reaction Buttons */}
      <div className="mt-3 flex gap-1">
        {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => handleQuickReaction(emoji)}
            className="h-7 w-7 p-0 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 opacity-60 hover:opacity-100"
          >
            {emoji}
          </Button>
        ))}
      </div>

      {/* Read Receipts */}
      {renderReadReceipts()}

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={showImageModal} 
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded border-4 border-white"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageModal(null)}
              className="absolute top-4 right-4 bg-white text-black border-2 border-black hover:bg-gray-100"
            >
              ✕ CLOSE
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageWithReadReceipt;