import { getSupabaseClient } from './supabaseClient';
import { LandlordEarningRow } from '../types';

export interface PaystackInitResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  status?: 'success' | 'failed' | 'pending' | 'abandoned' | string;
  booking?: any;
  paymentStatus?: 'paid' | 'failed' | 'pending' | 'cancelled';
  message?: string;
  error?: string;
  reference?: string;
}

/**
 * Initializes a Paystack transaction by calling the backend Edge Function `paystack-initialize-v2`.
 * The backend securely determines the authoritative booking amount, currency, and authenticated user.
 * 
 * @param bookingId The ID of the booking to pay for.
 * @returns PaystackInitResponse with authorization_url, access_code, and reference.
 */
export async function initializePaystackPayment(bookingId: string): Promise<PaystackInitResponse> {
  const client = getSupabaseClient();
  if (!bookingId || typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new Error('Booking ID is required to initialize payment.');
  }

  const cleanBookingId = bookingId.trim();

  // Call Supabase Edge Function paystack-initialize-v2 with ONLY bookingId
  const { data, error } = await client.functions.invoke('paystack-initialize-v2', {
    body: {
      bookingId: cleanBookingId
    }
  });

  if (error) {
    console.error('Paystack initialization error (paystack-initialize-v2):', error);
    let errorMsg = error.message || 'Payment initialization failed.';
    // Inspect error.context and response body if present
    if (error.context && typeof error.context === 'object') {
      try {
        const body = await (error.context as any).json();
        if (body?.error || body?.message) {
          errorMsg = body.error || body.message;
        }
      } catch (_) {}
    }
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('No response received from Paystack initialization function.');
  }

  if (data.success === false || data.error) {
    const errMsg = data.error || data.message || 'Paystack initialization failed.';
    throw new Error(errMsg);
  }

  if (!data.authorization_url) {
    throw new Error(data.message || 'Paystack did not return an authorization URL.');
  }

  return data;
}

/**
 * Verifies a Paystack payment reference by calling the backend Edge Function `paystack-verify-v2`.
 * 
 * @param reference The Paystack transaction reference string.
 * @param bookingId Optional booking ID.
 * @returns PaystackVerifyResponse with status and verified data.
 */
export async function verifyPaystackPayment(reference: string, bookingId?: string): Promise<PaystackVerifyResponse> {
  const client = getSupabaseClient();
  if (!reference || typeof reference !== 'string' || !reference.trim()) {
    throw new Error('Payment reference is required to verify payment.');
  }

  const cleanReference = reference.trim();

  const { data, error } = await client.functions.invoke('paystack-verify-v2', {
    body: {
      reference: cleanReference,
      ...(bookingId ? { bookingId: bookingId.trim() } : {})
    }
  });

  if (error) {
    console.error('Edge Function paystack-verify-v2 error:', error);
    let errorMsg = error.message || 'Payment verification failed.';
    if (error.context && typeof error.context === 'object') {
      try {
        const body = await (error.context as any).json();
        if (body?.error || body?.message) {
          errorMsg = body.error || body.message;
        }
      } catch (_) {}
    }
    throw new Error(errorMsg);
  }

  return data || { success: false, message: 'No verification payload returned.' };
}

export interface PayoutInitParams {
  amount: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PayoutInitResponse {
  success: boolean;
  payout_id?: string | number;
  reference?: string;
  requested_amount?: number;
  amount?: number;
  commission_rate?: number;
  commission_amount?: number;
  transfer_amount?: number;
  currency?: string;
  status?: string;
  recipient_name?: string;
  message?: string;
  error?: string;
}

export interface PayoutVerifyResponse {
  success: boolean;
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

/**
 * Initializes a Landlord Payout by invoking the current Supabase Edge Function `payout-initialize-v2`.
 * The backend securely calculates available balance, applies 5% Rentora commission, verifies bank details,
 * creates Paystack recipient and transfer, and records the authoritative payout transaction.
 */
export async function initializePayout(params: PayoutInitParams): Promise<PayoutInitResponse> {
  const client = getSupabaseClient();

  // Verify active authentication session before initiating withdrawal
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData?.session) {
    throw new Error('Please sign in to withdraw your earnings.');
  }

  const { amount, bankCode, bankName, accountNumber, accountName } = params;
  const numAmount = Number(amount);

  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw new Error('A valid withdrawal amount is required.');
  }
  if (numAmount < 1000) {
    throw new Error('Minimum withdrawal request is ₦1,000');
  }
  if (!bankCode || !bankCode.trim()) {
    throw new Error('A valid Paystack bank code is required.');
  }
  const normalizedAccountNumber = (accountNumber || '').replace(/\D/g, '');
  if (!normalizedAccountNumber || normalizedAccountNumber.length !== 10) {
    throw new Error('A valid 10-digit Nigerian bank account number is required.');
  }
  if (!accountName || !accountName.trim()) {
    throw new Error('Account name is required.');
  }

  const { data, error } = await client.functions.invoke('payout-initialize-v2', {
    body: {
      amount: numAmount,
      bankCode: bankCode.trim(),
      bankName: (bankName || '').trim(),
      accountNumber: normalizedAccountNumber,
      accountName: accountName.trim()
    }
  });

  if (error) {
    console.error('Edge Function payout-initialize-v2 error:', error);
    let errorMsg = error.message || 'Withdrawal initialization failed.';
    if (error.context && typeof error.context === 'object') {
      try {
        const body = await (error.context as any).json();
        if (body?.error || body?.message) {
          errorMsg = body.error || body.message;
        }
      } catch (_) {}
    }
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('No response received from payout initialization function.');
  }

  if (data.success === false || data.error) {
    const errMsg = data.error || data.message || 'Withdrawal initialization failed.';
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Verifies a Landlord Payout reference by invoking the Supabase Edge Function `payout-verify`.
 */
export async function verifyPayout(reference: string): Promise<PayoutVerifyResponse> {
  const client = getSupabaseClient();
  if (!reference || typeof reference !== 'string' || !reference.trim()) {
    throw new Error('Payout reference is required for verification.');
  }

  const cleanReference = reference.trim();
  const { data, error } = await client.functions.invoke('payout-verify', {
    body: {
      reference: cleanReference
    }
  });

  if (error) {
    console.error('Edge Function payout-verify error:', error);
    let errorMsg = error.message || 'Payout verification failed.';
    if (error.context && typeof error.context === 'object') {
      try {
        const body = await (error.context as any).json();
        if (body?.error || body?.message) {
          errorMsg = body.error || body.message;
        }
      } catch (_) {}
    }
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('No response received from payout verification function.');
  }

  if (data.success === false && (data.error || data.message)) {
    throw new Error(data.error || data.message);
  }

  return data;
}

/**
 * Fetches payout transactions securely from public.payout_transactions via Supabase RLS.
 */
export async function fetchPayoutTransactions(): Promise<any[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payout_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payout transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetches landlord earnings ledger records securely from public.landlord_earnings via Supabase RLS.
 * Landlords can read their own verified earnings.
 */
export async function fetchLandlordEarnings(): Promise<LandlordEarningRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('landlord_earnings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching landlord earnings:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetches payment transactions securely from public.payment_transactions via Supabase RLS.
 */
export async function fetchPaymentTransactions(): Promise<any[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Redirects the tenant's browser directly to the official Paystack hosted checkout URL using window.location.assign.
 */
export function redirectToPaystackCheckout(authorizationUrl: string): void {
  if (!authorizationUrl || typeof authorizationUrl !== 'string') {
    throw new Error('Valid Paystack authorization URL is required.');
  }
  window.location.assign(authorizationUrl);
}

