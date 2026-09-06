import { supabase } from '@/lib/supabase/client';

export async function calculateZakatApi(
  assets: number,
  goldPrice: number,
  silverPrice: number,
  isLunarYear: boolean = true
): Promise<{ data: any; error: any }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const response = await fetch(
        `/api/v1/zakat/calculate?assets=${assets}&goldPrice=${goldPrice}&silverPrice=${silverPrice}&isLunarYear=${isLunarYear}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return { data: result.data, error: null };
      } else {
        const err = await response.json();
        return { data: null, error: new Error(err.message || 'Failed to calculate Zakat') };
      }
    }
    return { data: null, error: new Error('No session') };
  } catch (apiErr) {
    return { data: null, error: apiErr };
  }
}

export async function saveZakatCalculationApi(payload: any): Promise<{ data: any; error: any }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const response = await fetch('/api/v1/zakat/calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        return { data: result.data, error: null };
      } else {
        const err = await response.json();
        return { data: null, error: new Error(err.message || 'Failed to save calculation') };
      }
    }
    return { data: null, error: new Error('No session') };
  } catch (apiErr) {
    return { data: null, error: apiErr };
  }
}
