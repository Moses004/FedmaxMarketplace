export interface BookingEmailPayload {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  listingPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  landlordEmail?: string;
  landlordName?: string;
  startDate: string;
  endDate: string;
  billingCycle: string;
  totalAmount: number;
  messageNote?: string;
}

export interface EmailLogEntry {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  bodyHtml: string;
  bookingId: string;
  listingTitle: string;
  guestName: string;
  status: 'sent' | 'simulated' | 'failed';
  serviceUsed: 'EmailJS' | 'Rentora Email Gateway' | 'SMTP';
  sentAt: string;
}

/**
 * Sends an email notification to the landlord when a new booking request is created.
 * Uses backend trigger API (/api/send-booking-email) with automatic fallback to EmailJS or local log store.
 */
export async function sendLandlordBookingNotification(
  payload: BookingEmailPayload
): Promise<{ success: boolean; message: string; recipient?: string; log?: EmailLogEntry }> {
  try {
    const response = await fetch('/api/send-booking-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || `Email alert successfully sent to ${data.recipient || 'landlord'}`,
        recipient: data.recipient,
        log: data.log,
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errData.error || 'Failed to dispatch landlord email alert.',
      };
    }
  } catch (error: any) {
    console.error('Error dispatching landlord booking email:', error);
    return {
      success: false,
      message: error?.message || 'Network error sending landlord notification email.',
    };
  }
}

/**
 * Fetches dispatched email logs from the backend email trigger service.
 */
export async function fetchEmailLogs(): Promise<EmailLogEntry[]> {
  try {
    const response = await fetch('/api/email-logs');
    if (response.ok) {
      const data = await response.json();
      return data.logs || [];
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch email logs:', err);
    return [];
  }
}

export interface WelcomeEmailPayload {
  userEmail: string;
  userName?: string;
  role?: 'guest' | 'landlord';
  country?: string;
  city?: string;
  preferredMarket?: string;
}

export interface BookingStatusEmailPayload {
  bookingId: string;
  tenantEmail: string;
  tenantName?: string;
  landlordName?: string;
  listingTitle: string;
  status: 'confirmed' | 'approved' | 'rejected' | 'declined' | 'cancelled';
  note?: string;
}

export interface ListingCreatedEmailPayload {
  landlordEmail: string;
  landlordName?: string;
  listingTitle: string;
  listingPrice: number;
  listingLocation?: string;
  category?: string;
}

/**
 * Dispatches an onboarding welcome email notification to a newly registered user (Tenant or Landlord).
 */
export async function sendWelcomeEmail(
  payload: WelcomeEmailPayload
): Promise<{ success: boolean; message: string; log?: EmailLogEntry }> {
  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message, log: data.log };
    }
    const errData = await response.json().catch(() => ({}));
    return { success: false, message: errData.error || 'Failed to dispatch welcome email.' };
  } catch (error: any) {
    console.error('Error dispatching welcome email:', error);
    return { success: false, message: error?.message || 'Network error sending welcome email.' };
  }
}

/**
 * Dispatches an email notification when a booking status changes (e.g. Approved or Declined by landlord).
 */
export async function sendBookingStatusNotification(
  payload: BookingStatusEmailPayload
): Promise<{ success: boolean; message: string; log?: EmailLogEntry }> {
  try {
    const response = await fetch('/api/email/booking-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message, log: data.log };
    }
    const errData = await response.json().catch(() => ({}));
    return { success: false, message: errData.error || 'Failed to dispatch booking status email.' };
  } catch (error: any) {
    console.error('Error dispatching booking status email:', error);
    return { success: false, message: error?.message || 'Network error sending booking status email.' };
  }
}

/**
 * Dispatches an email confirmation to a landlord when they publish a new property listing.
 */
export async function sendListingCreatedNotification(
  payload: ListingCreatedEmailPayload
): Promise<{ success: boolean; message: string; log?: EmailLogEntry }> {
  try {
    const response = await fetch('/api/email/listing-created', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message, log: data.log };
    }
    const errData = await response.json().catch(() => ({}));
    return { success: false, message: errData.error || 'Failed to dispatch listing confirmation email.' };
  } catch (error: any) {
    console.error('Error dispatching listing creation email:', error);
    return { success: false, message: error?.message || 'Network error sending listing creation email.' };
  }
}

/**
 * Clears sent email logs in the backend email trigger service.
 */
export async function clearEmailLogs(): Promise<boolean> {
  try {
    const response = await fetch('/api/email-logs/clear', { method: 'DELETE' });
    return response.ok;
  } catch (err) {
    return false;
  }
}
