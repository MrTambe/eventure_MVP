import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MenuBar } from "@/components/ui/glow-menu";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider, useTheme } from 'next-themes';
import { Home, Calendar, Users, Settings, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from '@/convex/_generated/dataModel';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AdminUser {
  _id: Id<"admins">;
  email: string;
  name?: string;
}

function AdminCommunicationContent() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState("Communication");
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex hooks
  const messages = useQuery(api.communication.getMessages);
  const postMessage = useMutation(api.communication.postMessage);
  const uploadFile = useMutation(api.communication.uploadFile);

  useEffect(() => {
    const adminData = sessionStorage.getItem("adminUser");
    if (adminData) {
      setAdminUser(JSON.parse(adminData));
    }
  }, []);

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    
    switch (itemName) {
      case 'Dashboard':
        navigate('/admin-dashboard');
        break;
      case 'Events':
        navigate('/admin-events');
        break;
      case 'Team':
        navigate('/admin-team');
        break;
      case 'Settings':
        navigate('/admin-settings');
        break;
      case 'Communication':
        navigate('/admin-communication');
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Communication', label: 'Communication', href: '/admin-communication', icon: MessageSquare, gradient: 'from-orange-500 to-red-500', iconColor: 'text-orange-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-pink-500', iconColor: 'text-red-500' }
  ];

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  const handleFileAttach = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      
      if (!isImage && !isPdf) {
        toast.error("Only images and PDF files are allowed.");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB.");
        return;
      }

      setSelectedFile(file);
      toast.success(`File "${file.name}" selected.`);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) {
      toast.error("Please enter a message or attach a file.");
      return;
    }

    setIsUploading(true);
    
    try {
      let attachmentUrl: string | undefined;
      let attachmentType: "image" | "pdf" | undefined;

      // Upload file if selected
      if (selectedFile) {
        // For now, we'll skip file upload and just post the message
        // File upload will be implemented in a future step
        toast.info("File upload will be implemented in the next step.");
      }

      // Post the message
      const result = await postMessage({
        messageText: messageText.trim(),
        attachmentUrl,
        attachmentType,
      });

      if (result.success) {
        toast.success(result.message);
        setMessageText("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isAdmin = adminUser !== null; // Simple admin check - can be enhanced later

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      {/* Fixed Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header Section */}
        <header className="border-b-2 border-black dark:border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">COMMUNICATION CENTER</h1>
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

        {/* Brutalist Page Header - Fixed/Sticky */}
        <div className="sticky top-0 z-40 bg-black dark:bg-white text-white dark:text-black border-b-4 border-black dark:border-white">
          <div className="text-center py-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              📢 ANNOUNCEMENTS
            </h2>
          </div>
        </div>

        {/* Scrollable Message Feed */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 py-6 overflow-y-auto pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages === undefined ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
                <p className="text-lg font-bold mt-4">LOADING MESSAGES...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-600 mb-2">NO MESSAGES YET</h2>
                <p className="text-gray-500">Be the first to post an announcement!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className="bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-4"
                >
                  {/* Message Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-sm uppercase tracking-wide">
                      {message.senderName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="text-base leading-relaxed mb-3">
                    {message.messageText}
                  </div>

                  {/* Attachment */}
                  {message.attachmentUrl && (
                    <div className="mt-3 border-2 border-gray-300 dark:border-gray-600 p-2">
                      {message.attachmentType === 'image' ? (
                        <img 
                          src={message.attachmentUrl} 
                          alt="Attachment" 
                          className="max-w-full h-auto max-h-64 object-contain"
                        />
                      ) : (
                        <a 
                          href={message.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline font-bold"
                        >
                          📄 View PDF Attachment
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fixed Input Bar at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-black border-t-4 border-black dark:border-white">
          <div className="max-w-4xl mx-auto p-4">
            {!isAdmin && (
              <div className="mb-4 text-center">
                <div className="bg-red-100 dark:bg-red-900 border-2 border-red-500 p-3">
                  <span className="text-red-700 dark:text-red-300 font-bold text-sm uppercase tracking-wide">
                    ⚠️ Only admins can post in this channel.
                  </span>
                </div>
              </div>
            )}

            {/* File Preview */}
            {selectedFile && (
              <div className="mb-4 bg-gray-100 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600 p-3 flex items-center justify-between">
                <span className="text-sm font-mono">
                  📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <Button
                  onClick={removeSelectedFile}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-4 items-end">
              {/* Multiline Text Input */}
              <div className="flex-1">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isAdmin ? "Type your announcement..." : "Only admins can post messages"}
                  disabled={!isAdmin || isUploading}
                  className="min-h-[80px] resize-none border-4 border-black dark:border-white font-mono text-base bg-white dark:bg-black disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  rows={3}
                />
              </div>

              {/* File Attach Button */}
              <Button
                onClick={handleFileAttach}
                disabled={!isAdmin || isUploading}
                className="h-[80px] w-16 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-4 border-black dark:border-white text-black dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400"
              >
                <Paperclip className="h-6 w-6" />
              </Button>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!isAdmin || (!messageText.trim() && !selectedFile) || isUploading}
                className="h-[80px] px-8 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-4 border-black dark:border-white font-bold text-lg uppercase tracking-wide disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-200"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    SENDING
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    POST
                  </>
                )}
              </Button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
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