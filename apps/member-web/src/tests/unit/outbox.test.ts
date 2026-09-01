import { describe, it, expect } from 'vitest';
import { processOutboxBatch } from '../../../api/lib/outbox';

describe('Transactional Outbox Worker (Phase 5)', () => {
  it('gracefully handles empty or unconfigured database outbox queue', async () => {
    // If database credentials or events are absent, outbox worker returns clean empty result without crashing
    const result = await processOutboxBatch(10);
    expect(result).toBeDefined();
    expect(typeof result.processedCount).toBe('number');
    expect(typeof result.successCount).toBe('number');
    expect(typeof result.failedCount).toBe('number');
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
