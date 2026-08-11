import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Wrench, 
  CalendarCheck, 
  DollarSign, 
  Info, 
  X, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  Clock,
  Trash2
} from 'lucide-react';
import { AppNotification, NotificationCategory, User, Booking, Listing } from '../types';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '../services/notificationService';

interface NotificationBellProps {
  currentUser: User | null;
  bookings?: Booking[];
  listings?: Listing[];
  onNavigateTab: (tab: 'explore' | 'dashboard' | 'bookings') => void;
  onOpenMaintenanceModal?: () => void;
}

export default function NotificationBell({
  currentUser,
  bookings = [],
  listings = [],
  onNavigateTab,
  onOpenMaintenanceModal,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load and sync notifications
  const reloadNotifications = () => {
    const items = getNotifications(currentUser, bookings, listings);
    setNotifications(items);
  };

  useEffect(() => {
    reloadNotifications();

    const handleUpdate = () => reloadNotifications();
    window.addEventListener('rentora_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('rentora_notifications_updated', handleUpdate);
    };
  }, [currentUser, bookings, listings]);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    markAllNotificationsAsRead(unreadIds);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationAsRead(notification.id);
    setIsOpen(false);

    if (notification.category === 'maintenance' && onOpenMaintenanceModal) {
      onOpenMaintenanceModal();
    } else if (notification.actionTab) {
      onNavigateTab(notification.actionTab);
    }
  };

  // Helper for category icon
  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'booking':
        return <CalendarCheck className="w-4 h-4 text-emerald-500" />;
      case 'rent_due':
        return <DollarSign className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-sky-500" />;
    }
  };

  // Helper for priority badge styling
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
            Notice
          </span>
        );
      default:
        return null;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diff = Date.now() - new Date(timestamp).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-xs focus:outline-hidden"
        title="Notifications Center"
        aria-label="Toggle Notifications Menu"
      >
        <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />

        {/* Unread Indicator Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-black border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-88 sm:w-96 max-w-[92vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden"
          >
            {/* Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                    Notification Center
                    {unreadCount > 0 && (
                      <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">Maintenance, bookings & rent alerts</p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors border border-emerald-500/30 cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('rent_due')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === 'rent_due'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>Rent Due</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('booking')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === 'booking'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bookings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('maintenance')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === 'maintenance'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Maintenance</span>
              </button>
            </div>

            {/* Notification List Scroll Body */}
            <div className="max-h-88 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">All caught up!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    No active notifications found in this category.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative p-3.5 transition-all cursor-pointer flex gap-3 items-start ${
                      !notif.isRead
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-xs ${
                        notif.category === 'rent_due'
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                          : notif.category === 'maintenance'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {notif.title}
                        </span>
                        {getPriorityBadge(notif.priority)}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatRelativeTime(notif.timestamp)}
                        </span>

                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" /> Mark read
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread Dot Indicator */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2 shadow-xs animate-pulse" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary Bar */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {filteredNotifications.length} alerts</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateTab('bookings');
                }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Bookings Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
