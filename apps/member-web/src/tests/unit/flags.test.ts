import { describe, it, expect, beforeEach } from 'vitest';
import { isFeatureEnabled, getFeatureFlags } from '@/lib/flags';

describe('Feature Flags System (Phase 3)', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    if (typeof window !== 'undefined') {
      (window as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = String(v);
        },
        removeItem: (k: string) => delete store[k],
        clear: () => Object.keys(store).forEach((k) => delete store[k]),
      };
    }
  });

  it('defaults to false for all feature flags when no overrides are set', () => {
    expect(isFeatureEnabled('backend_v1_enabled')).toBe(false);
    expect(isFeatureEnabled('backend_transactions_enabled')).toBe(false);
    expect(isFeatureEnabled('backend_dashboard_enabled')).toBe(false);

    const flags = getFeatureFlags();
    expect(flags.backend_v1_enabled).toBe(false);
    expect(flags.backend_transactions_enabled).toBe(false);
  });

  it('respects localStorage overrides for testing', () => {
    window.localStorage.setItem('ff_backend_transactions_enabled', 'true');
    expect(isFeatureEnabled('backend_transactions_enabled')).toBe(true);

    window.localStorage.setItem('ff_backend_transactions_enabled', 'false');
    expect(isFeatureEnabled('backend_transactions_enabled')).toBe(false);
  });

  it('evaluates user percentage hash deterministically', () => {
    const userA = 'usr_123456';
    const userB = 'usr_987654';

    // Same user produces consistent result
    const eval1 = isFeatureEnabled('backend_v1_enabled', userA, 50);
    const eval2 = isFeatureEnabled('backend_v1_enabled', userA, 50);
    expect(eval1).toBe(eval2);

    // 100% rollout enables for all users
    expect(isFeatureEnabled('backend_v1_enabled', userA, 100)).toBe(true);
    expect(isFeatureEnabled('backend_v1_enabled', userB, 100)).toBe(true);

    // 0% rollout disables for all users
    expect(isFeatureEnabled('backend_v1_enabled', userA, 0)).toBe(false);
    expect(isFeatureEnabled('backend_v1_enabled', userB, 0)).toBe(false);
  });
});
