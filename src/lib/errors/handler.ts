/**
 * Centralized error handling.
 * Maps technical errors to user-friendly messages.
 * NEVER expose SQL, stack traces, table names, or internal IDs to the user.
 */

export type AppErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_EMAIL_NOT_CONFIRMED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_TOO_MANY_REQUESTS'
  | 'AUTH_USER_NOT_FOUND'
  | 'AUTH_WEAK_PASSWORD'
  | 'AUTH_EMAIL_TAKEN'
  | 'PERMISSION_DENIED'
  | 'RECORD_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'LEDGER_UNBALANCED'
  | 'ACCOUNT_OWNERSHIP'
  | 'DUPLICATE_SUBMISSION'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
  field?: string;
}

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: 'Incorrect email or password. Please try again.',
  AUTH_EMAIL_NOT_CONFIRMED: 'Please check your inbox and confirm your email address before signing in.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_TOO_MANY_REQUESTS: 'Too many attempts. Please wait a few minutes and try again.',
  AUTH_USER_NOT_FOUND: 'If that email address is registered, you will receive a reset link.',
  AUTH_WEAK_PASSWORD: 'Password does not meet the security requirements.',
  AUTH_EMAIL_TAKEN: 'An account with that email address already exists.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  RECORD_NOT_FOUND: 'The requested record could not be found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection and try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again in a moment.',
  LEDGER_UNBALANCED: 'Transaction could not be saved due to a balance mismatch. Please try again.',
  ACCOUNT_OWNERSHIP: 'You do not have access to this account.',
  DUPLICATE_SUBMISSION: 'This action has already been submitted. Please refresh the page.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

/**
 * Parse an API or generic error into an AppError.
 */
export function parseError(error: unknown): AppError {
  if (!error) return { code: 'UNKNOWN', message: ERROR_MESSAGES.UNKNOWN };

  const msg = (error as Error).message ?? String(error);
  const statusCode = (error as { status?: number }).status;

  // Auth errors
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return { code: 'AUTH_INVALID_CREDENTIALS', message: ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS };
  }
  if (msg.includes('Email not confirmed')) {
    return { code: 'AUTH_EMAIL_NOT_CONFIRMED', message: ERROR_MESSAGES.AUTH_EMAIL_NOT_CONFIRMED };
  }
  if (msg.includes('JWT expired') || msg.includes('session_not_found') || statusCode === 401) {
    return { code: 'AUTH_SESSION_EXPIRED', message: ERROR_MESSAGES.AUTH_SESSION_EXPIRED };
  }
  if (msg.includes('rate limit') || msg.includes('Too many requests')) {
    return { code: 'AUTH_TOO_MANY_REQUESTS', message: ERROR_MESSAGES.AUTH_TOO_MANY_REQUESTS };
  }
  if (msg.includes('Password should be at least')) {
    return { code: 'AUTH_WEAK_PASSWORD', message: ERROR_MESSAGES.AUTH_WEAK_PASSWORD };
  }
  if (msg.includes('User already registered') || msg.includes('already been registered')) {
    return { code: 'AUTH_EMAIL_TAKEN', message: ERROR_MESSAGES.AUTH_EMAIL_TAKEN };
  }

  // RLS / permission errors
  if (msg.includes('row-level security') || statusCode === 403) {
    return { code: 'PERMISSION_DENIED', message: ERROR_MESSAGES.PERMISSION_DENIED };
  }
  if (statusCode === 404) {
    return { code: 'RECORD_NOT_FOUND', message: ERROR_MESSAGES.RECORD_NOT_FOUND };
  }

  // Network
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR };
  }

  // Ledger
  if (msg.includes('unbalanced') || msg.includes('LEDGER_UNBALANCED')) {
    return { code: 'LEDGER_UNBALANCED', message: ERROR_MESSAGES.LEDGER_UNBALANCED };
  }

  // Server 5xx
  if (statusCode && statusCode >= 500) {
    return { code: 'SERVER_ERROR', message: ERROR_MESSAGES.SERVER_ERROR };
  }

  return { code: 'UNKNOWN', message: ERROR_MESSAGES.UNKNOWN };
}

/**
 * Get the display message for an error code.
 */
export function getErrorMessage(code: AppErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN;
}
