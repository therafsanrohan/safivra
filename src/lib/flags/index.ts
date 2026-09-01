/**
 * Safivra Feature Flags System (Phase 3 — Strangler Pattern Rollout)
 *
 * Controls gradual migration of client traffic from direct browser->Supabase RPC calls
 * to the API v1 backend endpoints without downtime or risk.
 *
 * Supported Rollout Rules:
 *   - Global boolean override (env var or local storage)
 *   - User percentage rollout (hashing user_id to 0-100)
 *   - Per-feature toggle
 */

export type FeatureFlagKey =
  | 'backend_v1_enabled'
  | 'backend_transactions_enabled'
  | 'backend_dashboard_enabled'
  | 'backend_accounts_enabled'
  | 'redis_cache_enabled';

export interface FeatureFlags {
  backend_v1_enabled: boolean;
  backend_transactions_enabled: boolean;
  backend_dashboard_enabled: boolean;
  backend_accounts_enabled: boolean;
  redis_cache_enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  backend_v1_enabled: false,
  backend_transactions_enabled: false,
  backend_dashboard_enabled: false,
  backend_accounts_enabled: false,
  redis_cache_enabled: false,
};

/**
 * Deterministic hash of string (e.g., user_id) to a percentage (0-99).
 */
function hashToPercent(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Evaluates whether a feature flag is enabled for a given user.
 */
export function isFeatureEnabled(
  flag: FeatureFlagKey,
  userId?: string,
  rolloutPercentage = 0
): boolean {
  // 1. Check window/localStorage override (for local testing & internal QA)
  if (
    typeof window !== 'undefined' &&
    window.localStorage &&
    typeof window.localStorage.getItem === 'function'
  ) {
    const override = window.localStorage.getItem(`ff_${flag}`);
    if (override === 'true') return true;
    if (override === 'false') return false;
  }

  // 2. Check environment variable override
  const envKey = `VITE_FF_${flag.toUpperCase()}`;
  if (import.meta.env[envKey] === 'true') return true;

  // 3. User-based percentage rollout
  if (userId && rolloutPercentage > 0) {
    const userHashPercent = hashToPercent(`${flag}:${userId}`);
    if (userHashPercent < rolloutPercentage) {
      return true;
    }
  }

  return DEFAULT_FLAGS[flag] ?? false;
}

/**
 * Returns full active feature flag state for diagnosis.
 */
export function getFeatureFlags(userId?: string): FeatureFlags {
  return {
    backend_v1_enabled: isFeatureEnabled('backend_v1_enabled', userId),
    backend_transactions_enabled: isFeatureEnabled(
      'backend_transactions_enabled',
      userId
    ),
    backend_dashboard_enabled: isFeatureEnabled(
      'backend_dashboard_enabled',
      userId
    ),
    backend_accounts_enabled: isFeatureEnabled(
      'backend_accounts_enabled',
      userId
    ),
    redis_cache_enabled: isFeatureEnabled('redis_cache_enabled', userId),
  };
}
