import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Smile } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import EmojiPicker from 'emoji-picker-react';

interface PrivateDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: Id<"users">;
  recipientName: string;
  recipientImage?: string;
  currentUser: any;
}

interface PrivateMessage {
  _id: Id<"private_messages">;
  senderId: Id<"users">;
  recipientId: Id<"users">;
  content: string;
  timestamp: number;
  isRead: boolean;
  reactions?: Array<{
    emoji: string;
    userId: Id<"users">;
  }>;
}

export default function PrivateDMModal({ isOpen, onClose, recipientId, recipientName, recipientImage, currentUser: propCurrentUser }: PrivateDMModalProps) {
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current user
  const currentUser = useQuery(api.users.currentUser);

  // Fetch direct messages
  const messages = useQuery(
    api.privateMessages.getDirectMessages,
    isOpen && currentUser ? { recipientId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.privateMessages.sendDirectMessage);
  const markAsRead = useMutation(api.privateMessages.markPrivateMessageAsRead);
  const toggleReaction = useMutation(api.privateMessages.togglePrivateMessageReaction);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending || !currentUser) return;
    
    setIsSending(true);
    try {
      const result = await sendMessage({
        content: messageText.trim(),
        recipientId,
      });

      if (result?.success) {
        setMessageText("");
        toast.success("Message sent!");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiReaction = async (messageId: Id<"private_messages">, emoji: string) => {
    try {
      const result = await toggleReaction({ messageId, emoji });
      if (!result?.success) {
        toast.error("Failed to toggle reaction");
      }
    } catch (error) {
      toast.error("Failed to toggle reaction");
    }
  };

  const handleEmojiSelect = (emojiData: any) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageText.slice(0, start) + emojiData.emoji + messageText.slice(end);
      setMessageText(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length;
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{recipientName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            Direct Message with {recipientName || 'User'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[60vh]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages === undefined ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderId === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === currentUser?._id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message._creationTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 border rounded-lg">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width="100%"
                  height={300}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}