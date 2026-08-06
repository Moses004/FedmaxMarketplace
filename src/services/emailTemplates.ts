/**
 * Professional HTML Email Templates for Rentora RealEstate Platform.
 * Supports Onboarding, Rent Reminders, and Maintenance Updates.
 */

export interface WelcomeEmailParams {
  userName: string;
  userEmail: string;
  role?: 'guest' | 'landlord';
  country?: string;
  city?: string;
  preferredMarket?: string;
}

export interface RentDueReminderParams {
  tenantName: string;
  tenantEmail: string;
  listingTitle: string;
  amountDue: number;
  dueDate: string;
  currencySymbol?: string;
  paymentLink?: string;
}

export interface MaintenanceRequestParams {
  tenantName: string;
  tenantEmail: string;
  listingTitle: string;
  ticketId: string;
  issueTitle: string;
  status: 'In Progress' | 'Scheduled' | 'Resolved' | 'Pending Review';
  landlordNote?: string;
}

/**
 * Generates an HTML Welcome Email for newly onboarded Tenants or Landlords.
 */
export function getWelcomeEmailTemplate(params: WelcomeEmailParams): { subject: string; html: string } {
  const isLandlord = params.role === 'landlord';
  const subject = isLandlord
    ? `🏡 Welcome to Rentora Landlord Portal, ${params.userName}!`
    : `✨ Welcome to Rentora, ${params.userName}! Find Your Dream Verified Rental`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    
    <!-- Brand Header -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 32px 24px; text-align: left; color: #ffffff;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #10b981;">Rentora</span>
        <span style="font-size: 11px; font-weight: 800; background: rgba(16, 185, 129, 0.25); color: #34d399; padding: 3px 10px; border-radius: 99px; text-transform: uppercase;">Official Onboarding</span>
      </div>
      <h1 style="margin: 14px 0 4px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
        ${isLandlord ? 'Welcome to the Landlord Portal!' : 'Welcome to Your Next Living Space!'}
      </h1>
      <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
        Hi ${params.userName}, thank you for joining Rentora RealEstate Marketplace.
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
        ${isLandlord 
          ? `Your landlord account has been initialized successfully. You can now publish listings, track tenant booking applications, run Gemini AI price optimization, and collect lease payments.` 
          : `Your tenant profile is active! You can now browse verified rental apartments across Spain and global hubs, request viewings, calculate move-in budgets, and reserve securely.`}
      </p>

      <!-- Account Details Box -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</h3>
        <table style="width: 100%; font-size: 13px;">
          <tr><td style="color: #64748b; padding: 3px 0;">Role / Access:</td><td style="font-weight: 700; color: #0f172a;">${isLandlord ? 'Landlord / Property Owner' : 'Tenant / Guest Renter'}</td></tr>
          <tr><td style="color: #64748b; padding: 3px 0;">Email:</td><td style="font-weight: 700; color: #0284c7;">${params.userEmail}</td></tr>
          ${params.country ? `<tr><td style="color: #64748b; padding: 3px 0;">Location:</td><td style="font-weight: 700; color: #0f172a;">${params.city ? `${params.city}, ` : ''}${params.country}</td></tr>` : ''}
          ${params.preferredMarket ? `<tr><td style="color: #64748b; padding: 3px 0;">Preferred Market:</td><td style="font-weight: 700; color: #059669;">${params.preferredMarket}</td></tr>` : ''}
        </table>
      </div>

      <div style="text-align: center; margin-top: 28px;">
        <a href="https://rentora-realestate.com" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
          ${isLandlord ? 'Open Landlord Dashboard →' : 'Explore Rental Listings →'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0 0 4px 0;">Rentora RealEstate Onboarding Engine</p>
      <p style="margin: 0;">Dispatched to: <strong style="color: #64748b;">${params.userEmail}</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generates an HTML Rent Due Reminder Email for tenants.
 */
export function getRentDueReminderTemplate(params: RentDueReminderParams): { subject: string; html: string } {
  const currency = params.currencySymbol || '€';
  const formattedAmount = `${currency}${params.amountDue.toLocaleString()}`;
  const subject = `⏰ Upcoming Rent Payment Due: ${formattedAmount} for "${params.listingTitle}"`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    
    <!-- Urgent Alert Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: left; color: #ffffff;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px; font-weight: 900; color: #818cf8;">Rentora</span>
        <span style="font-size: 11px; font-weight: 800; background: rgba(129, 140, 248, 0.25); color: #c7d2fe; padding: 3px 10px; border-radius: 99px; text-transform: uppercase;">Payment Notice</span>
      </div>
      <h1 style="margin: 14px 0 4px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
        Upcoming Rent Schedule Reminder
      </h1>
      <p style="margin: 0; font-size: 13px; color: #c7d2fe;">
        Friendly reminder for ${params.tenantName}
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
        Hello ${params.tenantName}, your next monthly rent payment for <strong>"${params.listingTitle}"</strong> is scheduled for payment on or before <strong>${params.dueDate}</strong>.
      </p>

      <!-- Invoice Summary Card -->
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Amount Due</div>
        <div style="font-size: 28px; font-weight: 900; color: #4c1d95; margin-bottom: 12px;">${formattedAmount}</div>
        
        <table style="width: 100%; font-size: 13px; border-top: 1px dashed #c4b5fd; padding-top: 10px;">
          <tr><td style="color: #6b7280; padding: 3px 0;">Property:</td><td style="font-weight: 700; color: #1f2937;">${params.listingTitle}</td></tr>
          <tr><td style="color: #6b7280; padding: 3px 0;">Due Date:</td><td style="font-weight: 700; color: #dc2626;">${params.dueDate}</td></tr>
          <tr><td style="color: #6b7280; padding: 3px 0;">Payment Method:</td><td style="font-weight: 700; color: #0284c7;">Paystack / SSL Card Payout</td></tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 28px;">
        <a href="${params.paymentLink || 'https://rentora-realestate.com'}" target="_blank" style="display: inline-block; background-color: #6d28d9; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);">
          Pay Rent Online Now →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">Dispatched to tenant: <strong style="color: #64748b;">${params.tenantEmail}</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generates an HTML Maintenance Request Status Update Email.
 */
export function getMaintenanceRequestTemplate(params: MaintenanceRequestParams): { subject: string; html: string } {
  const subject = `🔧 Maintenance Update: Ticket #${params.ticketId} - ${params.status}`;

  const statusColor = 
    params.status === 'Resolved' ? '#059669' :
    params.status === 'Scheduled' ? '#0284c7' :
    params.status === 'In Progress' ? '#d97706' : '#64748b';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 32px 24px; text-align: left; color: #ffffff;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px; font-weight: 900; color: #38bdf8;">Rentora</span>
        <span style="font-size: 11px; font-weight: 800; background: rgba(56, 189, 248, 0.25); color: #7dd3fc; padding: 3px 10px; border-radius: 99px; text-transform: uppercase;">Maintenance Service</span>
      </div>
      <h1 style="margin: 14px 0 4px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
        Maintenance Ticket Update
      </h1>
      <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
        Status change notification for ticket #${params.ticketId}
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
        Hello ${params.tenantName}, the landlord or property manager has updated the status of your maintenance request for <strong>"${params.listingTitle}"</strong>.
      </p>

      <!-- Ticket Summary Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Ticket #${params.ticketId}</span>
          <span style="font-size: 12px; font-weight: 800; background-color: ${statusColor}; color: #ffffff; padding: 4px 12px; border-radius: 99px; text-transform: uppercase;">
            ${params.status}
          </span>
        </div>
        
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 800; color: #0f172a;">${params.issueTitle}</h3>
        
        <table style="width: 100%; font-size: 13px; margin-top: 10px;">
          <tr><td style="color: #64748b; padding: 3px 0;">Property:</td><td style="font-weight: 700; color: #1e293b;">${params.listingTitle}</td></tr>
          <tr><td style="color: #64748b; padding: 3px 0;">Updated Status:</td><td style="font-weight: 700; color: ${statusColor};">${params.status}</td></tr>
        </table>
      </div>

      ${params.landlordNote ? `
      <!-- Landlord Notes -->
      <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 4px;">Note from Property Manager / Landlord</div>
        <p style="margin: 0; font-size: 13px; color: #1e293b; font-style: italic;">"${params.landlordNote}"</p>
      </div>` : ''}

      <div style="text-align: center; margin-top: 28px;">
        <a href="https://rentora-realestate.com" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px;">
          View Tenant Portal →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">Dispatched to tenant: <strong style="color: #64748b;">${params.tenantEmail}</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
