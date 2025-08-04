import React, { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useInView } from 'react-intersection-observer';
import { Button } from "@/components/ui/button";
import { FileText, Download, Play, Image, Smile, Plus } from "lucide-react";
import { toast } from "sonner";
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '@/hooks/use-auth';

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
    type: "image" | "pdf" | "video";
  }>;
  emojiReactions: Array<{
    emoji: string;
    userId: Id<"users">;
    userName: string;
    timestamp: number;
  }>;
  readBy: Array<{
    userId: Id<"users">;
    readAt: number;
  }>;
}

interface MessageWithReadReceiptProps {
  message: Message;
  currentUserId?: Id<"users">;
  onEmojiReaction: (messageId: Id<"admin_communication_messages">, emoji: string) => void;
}

const MessageWithReadReceipt: React.FC<MessageWithReadReceiptProps> = ({
  message,
  currentUserId,
  onEmojiReaction,
}) => {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionTooltip, setShowReactionTooltip] = useState<string | null>(null);
  const markAsRead = useMutation(api.communication.markAsRead);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && user && message.senderId !== user._id) {
      const hasRead = message.readBy?.some(read => read.userId === user._id);
      if (!hasRead) {
        markAsRead({ messageId: message._id });
      }
    }
  }, [inView, user, message._id, message.senderId, message.readBy, markAsRead]);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div key={index} className="border-2 border-black dark:border-white p-2">
            {attachment.type === "image" && (
              <div className="flex items-center gap-2">
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="w-16 h-16 object-cover border-2 border-black dark:border-white"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold font-mono">{attachment.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="mt-1 text-xs border-2 border-black dark:border-white"
                  >
                    <Image className="w-3 h-3 mr-1" />
                    VIEW
                  </Button>
                </div>
              </div>
            )}
            
            {attachment.type === "pdf" && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2">
                <FileText className="w-8 h-8 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold font-mono">{attachment.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="mt-1 text-xs border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    DOWNLOAD PDF
                  </Button>
                </div>
              </div>
            )}
            
            {attachment.type === "video" && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2">
                <Play className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold font-mono">{attachment.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="mt-1 text-xs border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    PLAY VIDEO
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getEmojiCounts = () => {
    const emojiMap = new Map<string, { count: number; users: string[]; hasCurrentUser: boolean }>();
    
    message.emojiReactions?.forEach(reaction => {
      const existing = emojiMap.get(reaction.emoji) || { count: 0, users: [], hasCurrentUser: false };
      existing.count++;
      existing.users.push(reaction.userName);
      if (user && reaction.userId === user._id) {
        existing.hasCurrentUser = true;
      }
      emojiMap.set(reaction.emoji, existing);
    });
    
    return emojiMap;
  };

  const handleEmojiSelect = (emojiData: any) => {
    onEmojiReaction(message._id, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleQuickReaction = (emoji: string) => {
    onEmojiReaction(message._id, emoji);
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

      {/* Attachments */}
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
                    <div className="max-w-48">
                      {data.users.slice(0, 5).join(', ')}
                      {data.users.length > 5 && ` +${data.users.length - 5} more`}
                    </div>
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

      {/* Read Receipts - Only visible to sender */}
      {user && message.senderId === user._id && message.readBy && message.readBy.length > 0 && (
        <div className="mt-3 pt-2 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              READ BY:
            </span>
            <div className="flex -space-x-1">
              {message.readBy.slice(0, 5).map((read, index) => (
                <div
                  key={index}
                  className="w-5 h-5 bg-green-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-white dark:border-black font-bold"
                  title={`Read by user ${read.userId}`}
                >
                  {index + 1}
                </div>
              ))}
              {message.readBy.length > 5 && (
                <div className="w-5 h-5 bg-gray-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-white dark:border-black font-bold">
                  +{message.readBy.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageWithReadReceipt;