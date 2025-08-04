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
    if (!messageText.trim() && attachments.length === 0) {
      toast.error("Please enter a message or attach a file");
      return;
    }

    if (!adminUser || adminUser.role !== "admin") {
      toast.error("Only admins can post messages");
      return;
    }

    try {
      // For now, we'll simulate file upload URLs
      // In a real implementation, you'd upload files to storage first
      const attachmentData = attachments.map(attachment => ({
        url: attachment.url, // This would be the uploaded file URL
        name: attachment.name,
        type: attachment.type
      }));

      const result = await postMessage({
        messageText: messageText.trim(),
        attachments: attachmentData,
      });

      if (result.success) {
        toast.success("Message sent!");
        setMessageText("");
        setAttachments([]);
        // Clean up object URLs
        attachments.forEach(attachment => URL.revokeObjectURL(attachment.url));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleEmojiReaction = async (messageId: Id<"admin_communication_messages">, emoji: string) => {
    try {
      const result = await toggleEmojiReaction({ messageId, emoji });
      if (!result.success) {
        toast.error(result.message);
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

  const canSendMessage = messageText.trim().length > 0 || attachments.length > 0;
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
                <div className="text-xs text-gray-600 dark:text-gray-400">ANNOUNCEMENT CHANNEL</div>
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

        {/* Messages Feed */}
        <div className="flex flex-col h-[calc(100vh-120px)] pt-16">
          <div className="flex-1 overflow-y-auto p-4 pb-32">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages === undefined ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
                  <p className="text-lg font-bold mt-4">LOADING MESSAGES...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">NO MESSAGES YET</h2>
                  <p className="text-gray-500">Admins can start the conversation.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageWithReadReceipt
                    key={message._id}
                    message={message}
                    currentUserId={currentUser?._id}
                    onEmojiReaction={handleEmojiReaction}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Composer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t-4 border-black dark:border-white p-4 z-40">
            <div className="max-w-4xl mx-auto">
              {!isAdmin ? (
                <div className="bg-red-100 dark:bg-red-900/20 border-4 border-red-600 p-4 text-center">
                  <p className="text-red-600 font-bold font-mono">ADMIN ACCESS REQUIRED TO POST MESSAGES</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Attachment Previews */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="relative border-2 border-black dark:border-white p-2 bg-gray-50 dark:bg-gray-800">
                          <button
                            onClick={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          
                          {attachment.type === "image" && (
                            <div className="flex items-center gap-2">
                              <img src={attachment.url} alt={attachment.name} className="w-12 h-12 object-cover" />
                              <span className="text-xs font-mono">{attachment.name}</span>
                            </div>
                          )}
                          
                          {attachment.type === "pdf" && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-8 h-8 text-red-600" />
                              <span className="text-xs font-mono">{attachment.name}</span>
                            </div>
                          )}
                          
                          {attachment.type === "video" && (
                            <div className="flex items-center gap-2">
                              <Play className="w-8 h-8 text-blue-600" />
                              <span className="text-xs font-mono">{attachment.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-20 right-4 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}

                  {/* Input Row */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your announcement..."
                        className="min-h-[80px] max-h-[200px] resize-none border-4 border-black dark:border-white font-mono text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && canSendMessage) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachments.length >= 5}
                        className="border-4 border-black dark:border-white h-12 w-12"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="border-4 border-black dark:border-white h-12 w-12"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={handleSendMessage}
                        disabled={!canSendMessage}
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-6 h-12 border-4 border-black dark:border-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        POST
                      </Button>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
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