/**
 * Validate Egyptian phone number format
 * Must start with 01 and be 11 digits total
 */
export function validateEgyptPhoneNumber(phone: string): {
  isValid: boolean;
  error?: string;
} {
  const cleaned = phone.replace(/\s/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const phoneRegex = /^01[0-9]{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid format. Please enter 11 digits starting with 01 (e.g., 01012345678)',
    };
  }

  return { isValid: true };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
}

/**
 * Check if a reward has expired
 */
export function isRewardExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return new Date() > expiryDate;
}

/**
 * Get remaining time for reward in milliseconds
 */
export function getRewardTimeRemaining(expiresAt: Date | string | null): number {
  if (!expiresAt) return 0;
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const remaining = expiryDate.getTime() - new Date().getTime();
  return Math.max(0, remaining);
}
