/**
 * Idempotency Key Generator
 *
 * Generates unique, deterministic keys for financial POST operations so that
 * network retries never cause duplicate transactions.
 *
 * Strategy:
 *   - Each form submission generates one key at the START of submission
 *   - The key is passed to post_transaction() as p_idempotency_key
 *   - If Supabase returns an error and the user retries, the same key
 *     is NOT regenerated — a new key is only generated for a genuinely
 *     new intent to submit
 *   - The key expires on the server after 24 hours
 *
 * Key format:
 *   tx_{user_id_prefix}_{timestamp_ms}_{random_hex}
 *   Example: tx_a1b2c3_1725192400000_f3a9e1
 *
 * SECURITY NOTE:
 *   These keys are user-scoped on the server (user_id + key = unique).
 *   A key from User A cannot affect User B's transactions.
 */

/**
 * Generates a unique idempotency key for a financial transaction.
 * Call this ONCE when the user initiates a new transaction, not on every retry.
 */
export function generateIdempotencyKey(userIdPrefix?: string): string {
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(3));
  const randomHex = Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const prefix = userIdPrefix
    ? userIdPrefix.replace(/-/g, '').slice(0, 6)
    : 'anon';

  return `tx_${prefix}_${timestamp}_${randomHex}`;
}

/**
 * React hook that generates an idempotency key once per form mount.
 * The key is stable for the lifetime of the form.
 * A new key is generated when the component remounts (new transaction intent).
 *
 * Usage:
 *   const idempotencyKey = useIdempotencyKey(user?.id);
 *   // Pass idempotencyKey to post_transaction() as p_idempotency_key
 */
import { useRef } from 'react';

export function useIdempotencyKey(userId?: string): string {
  const keyRef = useRef<string | null>(null);
  if (keyRef.current === null) {
    keyRef.current = generateIdempotencyKey(userId);
  }
  return keyRef.current;
}
