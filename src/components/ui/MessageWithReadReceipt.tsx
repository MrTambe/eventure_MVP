import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import EmojiPicker from 'emoji-picker-react';

export interface Message {
  _id: Id<"admin_communication_messages">;
  messageText: string;
  senderId: Id<"users"> | Id<"admins">;
  senderName: string;
  timestamp: number;
  attachments?: any[];
  reactions?: { userId: Id<"users">; emoji: string; }[];
  isRead?: boolean;
}

interface MessageWithReadReceiptProps {
  message: Message;
  onEmojiReaction: (messageId: Id<"admin_communication_messages">, emoji: string) => void;
}

export const MessageWithReadReceipt: React.FC<MessageWithReadReceiptProps> = ({
  message,
  onEmojiReaction,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: false });
  const user = useQuery(api.users.currentUser);
  const markAsRead = useMutation(api.communication.markAsRead);
  const teamMemberCount = useQuery(api.communication.getTeamMemberCount);

  useEffect(() => {
    if (inView && user && message._id && message.senderId !== user._id) {
      const reactions = message.reactions || [];
      if (!reactions.some((read: any) => read.userId === user._id)) {
        markAsRead({ messageId: message._id });
      }
    }
  }, [inView, user, message._id, message.senderId, message.reactions, markAsRead]);

  const groupedReactions = useMemo(() => {
    if (!message.reactions) return {};
    
    return message.reactions.reduce((acc: any, reaction: any) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.userId);
      return acc;
    }, {});
  }, [message.reactions]);

  const reactionSummary = useMemo(() => {
    return Object.entries(groupedReactions).map(([emoji, userIds]: [string, any]) => ({
      emoji,
      count: userIds.length,
      hasCurrentUser: !!(user && userIds.includes(user._id)),
    }));
  }, [groupedReactions, user]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiReaction(message._id, emoji);
    setShowEmojiPicker(false);
  };

  const reactions = message.reactions || [];
  const readCount = reactions.length;
  const totalMembers = teamMemberCount || 0;

  return (
    <div ref={ref} className="p-4 border rounded-lg mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium">{message.senderName}</span>
        <span className="text-sm text-gray-500">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="mb-2">{message.messageText}</p>
      
      {/* Reactions */}
      {reactionSummary.length > 0 && (
        <div className="flex gap-1 mb-2">
          {reactionSummary.map(({ emoji, count, hasCurrentUser }) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={`px-2 py-1 rounded text-sm ${
                hasCurrentUser ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'
              } border`}
            >
              {emoji} {count}
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Add Reaction
        </button>
        
        {showEmojiPicker && (
          <div className="absolute top-8 left-0 z-10">
            <EmojiPicker
              onEmojiClick={(emojiData: any) => handleEmojiClick(emojiData.emoji)}
            />
          </div>
        )}
      </div>

      {/* Read receipts */}
      <div className="text-xs text-gray-500 mt-2">
        Read by {readCount} of {totalMembers} members
      </div>
    </div>
  );
};

export default MessageWithReadReceipt;