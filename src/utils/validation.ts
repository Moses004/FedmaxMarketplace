/**
 * Helper utility for regex-based form validations across Rentora.
 */

/**
 * Standard RFC-compliant email format validation regex.
 * Ensures local-part, @ symbol, valid domain, and a top-level domain of at least 2 chars.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates whether a given email string matches standard email formatting rules.
 * @param email - The email string to validate
 * @returns boolean indicating if the email format is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}
