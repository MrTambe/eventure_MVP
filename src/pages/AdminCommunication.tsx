import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Send, MessageSquare, Users, Settings, FileText, Paperclip, Home, Calendar } from 'lucide-react';
import { BrutalistDock } from "@/components/ui/brutalist-dock";
import { MessageWithReadReceipt, Message } from "@/components/ui/MessageWithReadReceipt";
import { useNavigate } from "react-router";
import { useTheme } from "@/components/theme-provider";
import { Protected } from "@/lib/protected-page";

interface AdminUser {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
}

interface AttachmentPreview {
  name: string;
  url: string;
  type: string;
}

export default function AdminCommunication() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user: adminUser } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [activeMenuItem, setActiveMenuItem] = useState("Communication");

  const messages = useQuery(api.communication.listMessages);
  const allUsers = useQuery(api.users.listAll);
  const teamMembers = useQuery(api.team.getAllTeamMembers);

  const postMessage = useMutation(api.communication.sendMessage);
  const toggleEmojiReaction = useMutation(api.communication.toggleEmojiReaction);

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: MessageSquare, gradient: 'from-blue-500 to-green-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Users, gradient: 'from-green-500 to-orange-500', iconColor: 'text-green-500' },
    { name: 'Communication', label: 'Communication', href: '/admin-communication', icon: Settings, gradient: 'from-orange-500 to-red-500', iconColor: 'text-orange-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    const item = menuItems.find(m => m.name === itemName);
    if (item) {
      navigate(item.href);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const result = await postMessage({
        content: messageText,
      });
      setMessageText("");
      setAttachments([]);
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleToggleReaction = async (messageId: Id<"admin_communication_messages">, emoji: string) => {
    if (!adminUser) return;
    try {
      const result = await toggleEmojiReaction({ messageId, emoji });
      if (result?.success) {
        toast.success("Reaction updated");
      } else {
        toast.error("Failed to toggle reaction");
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      toast.error("Failed to toggle reaction");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const previews = files.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setAttachments(prev => [...prev, ...previews]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const convertedMessages: Message[] = (messages || []).map(message => ({
    _id: message._id,
    senderId: message.authorId,
    senderName: message.authorName || 'Unknown',
    messageText: message.content,
    timestamp: message._creationTime,
    reactions: [],
    isRead: true,
    attachments: [],
  }));

  const adminNavItems = [
    { name: 'Dashboard', url: '/admin-dashboard', icon: Home },
    { name: 'Team', url: '/admin-team', icon: Users },
    { name: 'Events', url: '/admin-events', icon: Calendar },
    { name: 'Communication', url: '/admin-communication', icon: MessageSquare },
    { name: 'Settings', url: '/admin-settings', icon: Settings }
  ];

  return (
    <Protected>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {convertedMessages.map((message) => (
                <MessageWithReadReceipt
                  key={message._id}
                  message={message}
                  onEmojiReaction={handleToggleReaction}
                />
              ))}
            </div>
          </div>

          <div className="border-t bg-white dark:bg-gray-800 p-4">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative">
                    {attachment.type.startsWith('image/') ? (
                      <img src={attachment.url} alt={attachment.name} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setMessageText(prev => prev + emojiData.emoji);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 border-l bg-white dark:bg-gray-800">
          <BrutalistDock
            currentUser={adminUser}
            allUsers={allUsers || []}
            teamMembers={teamMembers || []}
          />
        </div>
      </div>
    </Protected>
  );
}