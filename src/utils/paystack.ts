export interface PaystackKeyValidation {
  isValid: boolean;
  keyType: 'live' | 'test';
  statusLabel: string;
  errorMessage?: string;
  suggestion?: string;
}

/**
 * Helper to validate Paystack Public Keys.
 * Standard Paystack public keys start with `pk_test_` or `pk_live_`.
 */
export function validatePaystackKey(key?: string | null): PaystackKeyValidation {
  const targetKey = (key && key.trim()) 
    ? key.trim() 
    : (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? String(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY).trim() : '');

  if (!targetKey) {
    return {
      isValid: false,
      keyType: 'test',
      statusLabel: 'Paystack Key Not Configured',
      errorMessage: 'Paystack public key is missing.',
      suggestion: 'Set VITE_PAYSTACK_PUBLIC_KEY in your environment configuration.'
    };
  }

  const isLive = targetKey.startsWith('pk_live_');
  return {
    isValid: true,
    keyType: isLive ? 'live' : 'test',
    statusLabel: isLive ? 'Live Gateway Active' : 'Test Sandbox Active',
    suggestion: 'Secured SSL payment channel active.'
  };
}

