import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MenuBar } from "@/components/ui/glow-menu";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider, useTheme } from 'next-themes';
import { Home, Calendar, Users, Settings, Paperclip, Smile, Send, X, FileText, Image, Play } from "lucide-react";
import MessageWithReadReceipt from "@/components/ui/MessageWithReadReceipt";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";
import EmojiPicker from 'emoji-picker-react';

interface AdminUser {
  _id: Id<"admins">;
  email: string;
  name?: string;
  role?: string;
}

interface AttachmentPreview {
  file: File;
  url: string;
  name: string;
  type: "image" | "pdf" | "video";
}

function AdminCommunicationContent() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState("Communication");
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Fetch data
  const messages = useQuery(api.communication.getMessages);
  const currentUser = useQuery(api.users.currentUser);

  // Mutations
  const postMessage = useMutation(api.communication.postMessage);
  const toggleEmojiReaction = useMutation(api.communication.toggleEmojiReaction);

  // Load admin user from session storage
  useEffect(() => {
    const adminData = sessionStorage.getItem("adminUser");
    if (adminData) {
      setAdminUser(JSON.parse(adminData));
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Communication', label: 'Communication', href: '/admin-communication', icon: Settings, gradient: 'from-orange-500 to-red-500', iconColor: 'text-orange-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    const menuItem = menuItems.find(item => item.name === itemName);
    if (menuItem?.href) {
      navigate(menuItem.href);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments allowed per message");
      return;
    }

    files.forEach(file => {
      // Validate file type
      const validTypes = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        toast.error(`Unsupported file type: ${file.name}`);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 10MB)`);
        return;
      }

      // Determine file type
      let type: "image" | "pdf" | "video";
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(fileExtension)) {
        type = "image";
      } else if (fileExtension === '.pdf') {
        type = "pdf";
      } else if (fileExtension === '.mp4') {
        type = "video";
      } else {
        return;
      }

      // Create preview
      const url = URL.createObjectURL(file);
      const preview: AttachmentPreview = {
        file,
        url,
        name: file.name,
        type
      };

      setAttachments(prev => [...prev, preview]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
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

  const handleSendMessage = async () => {
    if (!canSend) return;
    setIsPosting(true);
    try {
      const result = await postMessage({
        messageText,
        attachments,
      });

      if (result && result.success) {
        toast.success("Message posted successfully!");
        setMessageText("");
        setAttachments([]);
      } else {
        toast.error(result?.message || "Failed to post message");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleEmojiReaction = async (messageId: Id<"admin_communication_messages">, emoji: string) => {
    try {
      const result = await toggleEmojiReaction({ messageId, emoji });
      if (!result || !result.success) {
        toast.error(result?.message || "Failed to toggle reaction");
      }
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  const canSend = messageText.trim().length > 0 || attachments.length > 0;
  const isAdmin = adminUser?.role === "admin";

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <header className="border-b-2 border-black dark:border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ADMIN COMMUNICATION</h1>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold">{getCurrentDate()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">ADMIN PANEL</div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-lg">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border-2 border-black dark:border-white">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        {/* Floating Navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Messages Display */}
          <div className="space-y-6 mb-8">
            {messages === undefined ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
                <p className="text-lg font-bold mt-4">LOADING MESSAGES...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-600 mb-2">NO MESSAGES</h2>
                <p className="text-gray-500">Start the conversation by posting the first message.</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageWithReadReceipt
                  key={message._id}
                  message={message}
                  onEmojiReaction={handleEmojiReaction}
                />
              ))
            )}
          </div>

          {/* Enhanced Message Composer */}
          {isAdmin && (
            <div className="bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-6">
              <h3 className="text-xl font-bold mb-4 font-mono tracking-tight uppercase">POST MESSAGE</h3>
              
              {/* Message Input */}
              <div className="mb-4">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-32 p-3 border-2 border-black dark:border-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black"
                />
              </div>

              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-2 font-mono">ATTACHMENTS ({attachments.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="relative border-2 border-black dark:border-white p-2 bg-gray-50 dark:bg-gray-800">
                        {attachment.type === 'image' ? (
                          <img src={attachment.url} alt={attachment.name} className="w-full h-20 object-cover" />
                        ) : (
                          <div className="w-full h-20 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            <FileText className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        <p className="text-xs font-mono mt-1 truncate">{attachment.name}</p>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center border border-black dark:border-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {/* File Upload */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 font-mono text-sm">
                      {attachments.length < 5 ? (
                        <>
                          <Paperclip className="w-4 h-4" />
                          ATTACH
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-bold">MAX 5 ATTACHMENTS</div>
                        </>
                      )}
                    </div>
                  </label>

                  {/* Emoji Picker Toggle */}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 font-mono text-sm"
                  >
                    😀 EMOJI
                  </button>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!canSend || isPosting}
                  className={`px-6 py-2 font-mono text-sm font-bold border-2 border-black dark:border-white transition-colors ${
                    canSend && !isPosting
                      ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isPosting ? 'POSTING...' : 'SEND MESSAGE'}
                </button>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-4 border-2 border-black dark:border-white">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMessageText(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCommunication() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminCommunicationContent />
    </ThemeProvider>
  );
}