import { useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { ScenarioRequest, ScenarioResponse, GuidanceLoadState } from './types';

const API_BASE = import.meta.env.VITE_API_URL as string;

/**
 * Hook for the Financial Guidance feature.
 *
 * - Fetches a spending scenario from POST /v1/analytics/scenario.
 * - Never touches the ledger, balance, or budget tables.
 * - Owner scope is always enforced by the NestJS layer.
 */
export function useGuidanceData() {
  const { session } = useAuthContext();
  const [state, setState] = useState<GuidanceLoadState>({ status: 'idle' });

  const calculate = useCallback(
    async (request: ScenarioRequest) => {
      if (!session) return;
      setState({ status: 'loading' });

      try {
        const res = await fetch(`${API_BASE}/v1/analytics/scenario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(request),
        });

        const data: ScenarioResponse & { service_available?: boolean } =
          await res.json();

        if (!res.ok || data.service_available === false) {
          setState({
            status: 'unavailable',
            limitations: data?.limitations ?? [
              'Financial guidance is temporarily unavailable.',
            ],
          });
          return;
        }

        setState({ status: 'success', data, timestamp: Date.now() });
      } catch {
        setState({
          status: 'error',
          message: 'Could not connect to the guidance service.',
        });
      }
    },
    [session]
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, calculate, reset };
}
