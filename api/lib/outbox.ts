import { createClient } from '@supabase/supabase-js';
import { cacheInvalidateUser } from './redis';

function getServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service credentials missing');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export interface OutboxProcessResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Processes pending Transactional Outbox Events (Phase 5).
 * Atomically locks events, dispatches side-effects (cache invalidation, notifications, analytics),
 * and marks events completed or failed.
 */
export async function processOutboxBatch(
  batchSize = 25
): Promise<OutboxProcessResult> {
  const result: OutboxProcessResult = {
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    const supabase = getServiceRoleSupabaseClient();

    // 1. Atomically fetch and lock pending events via SECURITY DEFINER RPC
    const { data: events, error: fetchErr } = await supabase.rpc(
      'fetch_pending_outbox_events',
      { p_batch_size: batchSize }
    );

    if (fetchErr) {
      console.error('[Outbox Worker] Fetch error:', fetchErr);
      result.errors.push(`Fetch error: ${fetchErr.message}`);
      return result;
    }

    if (!events || events.length === 0) {
      return result; // No pending outbox events
    }

    result.processedCount = events.length;

    // 2. Process each event asynchronously
    for (const evt of events) {
      try {
        await handleOutboxEvent(evt);

        // Mark event completed
        await supabase.rpc('complete_outbox_event', {
          p_event_id: evt.id,
          p_status: 'completed',
          p_error: null,
        });

        result.successCount += 1;
      } catch (evtErr: any) {
        console.error(`[Outbox Worker] Error processing event ${evt.id}:`, evtErr);
        result.failedCount += 1;
        result.errors.push(`Event ${evt.id}: ${evtErr.message || 'Unknown error'}`);

        // Mark event failed with error message
        await supabase.rpc('complete_outbox_event', {
          p_event_id: evt.id,
          p_status: 'failed',
          p_error: String(evtErr.message || evtErr),
        });
      }
    }
  } catch (err: any) {
    console.error('[Outbox Worker] Fatal batch error:', err);
    result.errors.push(`Fatal error: ${err.message || 'Unknown'}`);
  }

  return result;
}

/**
 * Dispatches handlers for individual outbox event types.
 * Pure side-effects: notifications, Redis read model sync, pre-computed balance refresh.
 */
async function handleOutboxEvent(event: any): Promise<void> {
  const { user_id, event_type, payload } = event;

  switch (event_type) {
    case 'transaction.created':
    case 'transaction.voided':
    case 'account.archived':
      // 1. Invalidate Redis read models for user
      await cacheInvalidateUser(user_id);
      break;

    default:
      console.log(`[Outbox Worker] Unhandled event type: ${event_type}`);
      break;
  }
}
