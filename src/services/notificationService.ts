import { AppNotification, Booking, Listing, User } from '../types';

const READ_NOTIFICATIONS_KEY = 'rentora_read_notifications_v1';
const DELETED_NOTIFICATIONS_KEY = 'rentora_deleted_notifications_v1';
const CUSTOM_NOTIFICATIONS_KEY = 'rentora_custom_notifications_v1';

function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function getDeletedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_NOTIFICATIONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function getCustomNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(CUSTOM_NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNotificationAsRead(id: string): void {
  const set = getReadSet();
  set.add(id);
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new Event('rentora_notifications_updated'));
}

export function markAllNotificationsAsRead(ids: string[]): void {
  const set = getReadSet();
  ids.forEach(id => set.add(id));
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new Event('rentora_notifications_updated'));
}

export function deleteNotification(id: string): void {
  const set = getDeletedSet();
  set.add(id);
  localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new Event('rentora_notifications_updated'));
}

export function addCustomNotification(
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>
): AppNotification {
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };

  const custom = getCustomNotifications();
  custom.unshift(newNotif);
  localStorage.setItem(CUSTOM_NOTIFICATIONS_KEY, JSON.stringify(custom));
  window.dispatchEvent(new Event('rentora_notifications_updated'));
  return newNotif;
}

/**
 * Generates combined real-time and context-aware notifications for the current user
 */
export function getNotifications(
  currentUser: User | null,
  bookings: Booking[] = [],
  listings: Listing[] = []
): AppNotification[] {
  const readIds = getReadSet();
  const deletedIds = getDeletedSet();
  const isLandlord = currentUser?.role === 'landlord';

  // Base list of notifications
  const items: AppNotification[] = [];

  // 1. Rent Due Deadlines
  if (isLandlord) {
    items.push({
      id: 'notif-rent-due-landlord-1',
      title: 'Monthly Rent Disbursement Scheduled',
      message: 'Next automated landlord payout of $3,450 is scheduled for processing on Aug 15, 2026.',
      category: 'rent_due',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
      isRead: false,
      priority: 'high',
      actionTab: 'dashboard',
      metadata: {
        amount: 3450,
        dueDate: '2026-08-15',
      },
    });
  } else {
    items.push({
      id: 'notif-rent-due-tenant-1',
      title: 'Upcoming Rent Payment Deadline',
      message: 'Your monthly rent payment of $1,250 for Lekki Phase 1 Waterfront Penthouse is due in 3 days (Aug 14, 2026).',
      category: 'rent_due',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
      isRead: false,
      priority: 'urgent',
      actionTab: 'bookings',
      metadata: {
        amount: 1250,
        propertyTitle: 'Lekki Phase 1 Waterfront Penthouse',
        dueDate: '2026-08-14',
      },
    });
    items.push({
      id: 'notif-rent-due-tenant-2',
      title: 'Annual Lease Renewal Statement',
      message: 'Your lease agreement statement is available for download with a 5% early renewal discount.',
      category: 'rent_due',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18h ago
      isRead: false,
      priority: 'medium',
      actionTab: 'bookings',
    });
  }

  // 2. Maintenance Tickets
  items.push({
    id: 'notif-maint-1',
    title: 'New Maintenance Ticket #MT-8492',
    message: 'Plumbing Triage: Pressure valve inspection scheduled for Thursday at 10:00 AM.',
    category: 'maintenance',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5h ago
    isRead: false,
    priority: 'high',
    actionTab: isLandlord ? 'dashboard' : 'bookings',
    metadata: {
      ticketId: 'MT-8492',
      status: 'Scheduled',
    },
  });

  items.push({
    id: 'notif-maint-2',
    title: 'Maintenance Update: HVAC Inspection',
    message: 'Technician report generated for Victoria Island Suite. Air filter replacement complete.',
    category: 'maintenance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 26h ago
    isRead: false,
    priority: 'medium',
    actionTab: isLandlord ? 'dashboard' : 'bookings',
    metadata: {
      ticketId: 'MT-7104',
      status: 'Resolved',
    },
  });

  // 3. Dynamic Booking Approvals & Status Updates
  bookings.slice(0, 5).forEach((b) => {
    let title = '';
    let message = '';
    let priority: AppNotification['priority'] = 'medium';

    if (b.status === 'confirmed' || b.status === 'approved') {
      title = isLandlord ? `Booking Confirmed: ${b.listingTitle}` : `Booking Approved! ${b.listingTitle}`;
      message = isLandlord
        ? `Tenant ${b.guestName} completed payment confirmation for $${b.totalAmount || b.listingPrice}.`
        : `Your reservation for "${b.listingTitle}" was approved by the property owner.`;
      priority = 'high';
    } else if (b.status === 'pending') {
      title = isLandlord ? `New Booking Approval Needed: ${b.listingTitle}` : `Booking Request Pending Review`;
      message = isLandlord
        ? `${b.guestName} requested a move-in viewing on ${new Date(b.startDate).toLocaleDateString()}.`
        : `Your viewing request for "${b.listingTitle}" is awaiting landlord review.`;
      priority = 'medium';
    } else {
      title = `Booking Status Updated: ${b.listingTitle}`;
      message = `Status changed to ${b.status} for ${b.guestName}.`;
      priority = 'low';
    }

    items.push({
      id: `notif-booking-${b.id}`,
      title,
      message,
      category: 'booking',
      timestamp: b.createdAt || new Date().toISOString(),
      isRead: false,
      priority,
      actionTab: 'bookings',
      metadata: {
        bookingId: b.id,
        listingId: b.listingId,
        propertyTitle: b.listingTitle,
        status: b.status,
      },
    });
  });

  // 4. Custom notifications added locally
  const custom = getCustomNotifications();

  const combined = [...custom, ...items];

  // Filter out deleted notifications and map read statuses
  return combined
    .filter((item) => !deletedIds.has(item.id))
    .map((item) => ({
      ...item,
      isRead: item.isRead || readIds.has(item.id),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
