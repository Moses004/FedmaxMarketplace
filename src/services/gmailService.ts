/**
 * Gmail API Integration Service for Rentora RealEstate Platform
 * Provides authenticated Gmail integration for sending rent reminders, welcome emails, 
 * maintenance updates, and viewing mailbox status.
 */

export interface SendGmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
  confirmPrompt?: boolean; // Requires explicit user confirmation if true
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

/**
 * Encodes an HTML email into a base64url encoded RFC 2822 format required by the Gmail REST API.
 */
function createMimeMessage(to: string, subject: string, htmlBody: string, fromName: string = 'Rentora RealEstate'): string {
  const str = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    ``,
    htmlBody
  ].join('\r\n');

  // Convert string to base64url format
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetches the authenticated user's Gmail profile information.
 */
export async function getGmailProfile(accessToken: string): Promise<GmailProfile> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Gmail profile.');
  }

  return response.json();
}

/**
 * Sends an email using the official Gmail API (https://gmail.googleapis.com/gmail/v1/users/me/messages/send).
 * Requires explicit user confirmation before executing when confirmPrompt is true.
 */
export async function sendGmailMessage(
  accessToken: string,
  params: SendGmailParams
): Promise<{ id: string; threadId: string; labelIds: string[] }> {
  const { to, subject, htmlBody, fromName = 'Rentora RealEstate', confirmPrompt = true } = params;

  if (confirmPrompt) {
    const userConfirmed = window.confirm(
      `Send email via Gmail API?\n\nTo: ${to}\nSubject: ${subject}\n\nDo you want to authorize sending this email through your Gmail account?`
    );
    if (!userConfirmed) {
      throw new Error('User cancelled sending email via Gmail.');
    }
  }

  const rawMessage = createMimeMessage(to, subject, htmlBody, fromName);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to send email via Gmail API.');
  }

  return response.json();
}

/**
 * Fetches recent email messages sent or received in Gmail.
 */
export async function listGmailMessages(accessToken: string, maxResults: number = 10): Promise<GmailMessageItem[]> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Gmail messages.');
  }

  const data = await response.json();
  const messages: { id: string; threadId: string }[] = data.messages || [];

  // Detail fetch for headers (subject, snippet, date)
  const detailedMessages: GmailMessageItem[] = await Promise.all(
    messages.slice(0, 5).map(async (msg) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subjectHeader = headers.find((h: any) => h.name === 'Subject')?.value;
        const fromHeader = headers.find((h: any) => h.name === 'From')?.value;
        const dateHeader = headers.find((h: any) => h.name === 'Date')?.value;

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet,
          subject: subjectHeader || 'No Subject',
          from: fromHeader || 'Unknown Sender',
          date: dateHeader || '',
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return detailedMessages;
}
