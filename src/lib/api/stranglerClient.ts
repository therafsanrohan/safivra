/**
 * Safivra Strangler Pattern API Client (Phase 3)
 *
 * Implements progressive routing from browser direct-to-Supabase calls to
 * the new API v1 modular backend endpoints.
 *
 * ZERO-RISK GUARANTEE:
 *   If feature flag is OFF, or if the API v1 endpoint returns a network error/500,
 *   it transparently falls back to direct Supabase RPC / client query without
 *   disrupting the user experience.
 */

import { supabase } from '@/lib/supabase/client';
import { isFeatureEnabled } from '@/lib/flags';

interface PostTransactionParams {
  p_transaction_type: string;
  p_transaction_date: string;
  p_title: string;
  p_amount: number;
  p_account_id?: string | null;
  p_category_id?: string | null;
  p_destination_account_id?: string | null;
  p_merchant?: string | null;
  p_description?: string | null;
  p_transaction_time?: string | null;
  p_principal_amount?: number | null;
  p_interest_amount?: number | null;
  p_fee_amount?: number | null;
  p_loan_id?: string | null;
  p_credit_card_id?: string | null;
  p_idempotency_key?: string | null;
}

/**
 * Executes post_transaction via API v1 backend if feature flag is active,
 * otherwise via direct Supabase RPC. Fallback on backend error.
 */
export async function postTransactionApi(
  params: PostTransactionParams,
  userId?: string
): Promise<{ data: any; error: any }> {
  const isBackendEnabled = isFeatureEnabled(
    'backend_transactions_enabled',
    userId
  );

  if (isBackendEnabled) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/v1/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'X-Idempotency-Key': params.p_idempotency_key || '',
          },
          body: JSON.stringify({
            transaction_type: params.p_transaction_type,
            transaction_date: params.p_transaction_date,
            title: params.p_title,
            amount: params.p_amount,
            account_id: params.p_account_id,
            category_id: params.p_category_id,
            destination_account_id: params.p_destination_account_id,
            merchant: params.p_merchant,
            description: params.p_description,
            transaction_time: params.p_transaction_time,
            principal_amount: params.p_principal_amount,
            interest_amount: params.p_interest_amount,
            fee_amount: params.p_fee_amount,
            loan_id: params.p_loan_id,
            credit_card_id: params.p_credit_card_id,
            idempotency_key: params.p_idempotency_key,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return { data: result.data, error: null };
        }
      }
    } catch (apiErr) {
      console.warn(
        '[Strangler Pattern] API v1 failed, falling back to direct Supabase RPC:',
        apiErr
      );
    }
  }

  // Baseline path: Direct Supabase RPC
  return await supabase.rpc('post_transaction', params as any);
}

/**
 * Fetches dashboard summary via API v1 backend if enabled,
 * otherwise via direct Supabase RPC.
 */
export async function getDashboardSummaryApi(
  monthsBack = 6,
  userId?: string
): Promise<{ data: any; error: any }> {
  const isBackendEnabled = isFeatureEnabled('backend_dashboard_enabled', userId);

  if (isBackendEnabled) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(`/api/v1/dashboard?months=${monthsBack}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          return { data: result.data, error: null };
        }
      }
    } catch (apiErr) {
      console.warn(
        '[Strangler Pattern] Dashboard API failed, falling back to direct RPC:',
        apiErr
      );
    }
  }

  // Baseline path: Direct RPC call
  return await supabase.rpc('get_dashboard_summary', {
    p_months_back: monthsBack,
  } as any);
}
