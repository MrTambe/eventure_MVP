import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Id } from '@/convex/_generated/dataModel';

interface NotificationBellProps {
  recipientId: string | undefined;
}

function formatTimeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ recipientId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only query when recipientId is a non-empty string
  const hasValidRecipient = !!recipientId && recipientId.length > 0;

  const unreadCount = useQuery(
    api.communication.getUnreadNotificationCount,
    hasValidRecipient ? { recipientId } : "skip"
  );

  // Always subscribe to notifications when dropdown is open AND recipientId is valid
  const notifications = useQuery(
    api.communication.getUserNotifications,
    hasValidRecipient && isOpen ? { recipientId } : "skip"
  );

  const markAsRead = useMutation(api.communication.markNotificationAsRead);
  const markAllRead = useMutation(api.communication.markAllNotificationsAsRead);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    if (!hasValidRecipient) return;
    try {
      await markAllRead({ recipientId: recipientId! });
    } catch {
      // silently fail
    }
  };

  // Don't render if no valid recipient
  if (!hasValidRecipient) {
    return (
      <div className="relative">
        <button
          disabled
          className="relative p-2 border-2 border-black/30 dark:border-white/30 bg-white dark:bg-neutral-900 opacity-50 cursor-not-allowed"
        >
          <Bell size={18} className="text-black dark:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        <Bell size={18} className="text-black dark:text-white" />
        {/* Unread badge */}
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black border border-black dark:border-white px-1">
            {unreadCount! > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black dark:border-white">
              <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
                Notifications
              </span>
              {(unreadCount ?? 0) > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#6D28D9] hover:underline cursor-pointer"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            {notifications === undefined ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Bell size={24} className="text-neutral-400" />
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                  No notifications
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10 dark:divide-white/10">
                {notifications.map((notification: any) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                      notification.isRead
                        ? 'bg-white dark:bg-neutral-900 opacity-60'
                        : 'bg-[#6D28D9]/5 dark:bg-[#6D28D9]/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black dark:text-white leading-relaxed">
                        {notification.content}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mt-1">
                        {formatTimeAgo(notification._creationTime)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkRead(notification._id)}
                        className="flex-shrink-0 p-1 border border-black/30 dark:border-white/30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check size={12} className="text-[#6D28D9]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}