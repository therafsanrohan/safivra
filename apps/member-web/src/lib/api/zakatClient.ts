import { supabase } from '@/lib/supabase/client';

export interface ZakatCalculationResult {
  isEligible: boolean;
  liability: number;
  thresholds: {
    goldNisab: number;
    silverNisab: number;
    activeNisab: number;
    standard: string;
  };
}

/**
 * Calculates Zakat eligibility and amount entirely on the client.
 * No external API call is required – all logic is pure arithmetic.
 *
 * @param netWealth    Net Zakatable Wealth (assets − liabilities) in BDT
 * @param goldPrice    Gold price per gram in BDT
 * @param silverPrice  Silver price per gram in BDT
 * @param nisabStandard  'gold' | 'silver'
 * @param zakatPct     Zakat percentage (default 2.5)
 */
export function calculateZakatLocally(
  netWealth: number,
  goldPrice: number,
  silverPrice: number,
  nisabStandard: string = 'gold',
  zakatPct: number = 2.5
): ZakatCalculationResult {
  const NISAB_GOLD_GRAMS = 85;
  const NISAB_SILVER_GRAMS = 595;

  const goldNisab = goldPrice * NISAB_GOLD_GRAMS;
  const silverNisab = silverPrice * NISAB_SILVER_GRAMS;
  const activeNisab = nisabStandard === 'silver' ? silverNisab : goldNisab;

  const isEligible = netWealth >= activeNisab;
  const liability = isEligible ? parseFloat(((netWealth * zakatPct) / 100).toFixed(2)) : 0;

  return {
    isEligible,
    liability,
    thresholds: {
      goldNisab,
      silverNisab,
      activeNisab,
      standard: nisabStandard,
    },
  };
}

export interface SaveZakatPayload {
  rule_set_id: string;
  rate_snapshot_id: string;
  status: string;
  zakat_anniversary_date: string;
  total_assets: number;
  total_deductions: number;
  net_zakatable_wealth: number;
  is_eligible: boolean;
  estimated_zakat_amount: number;
  currency: string;
  items: Array<{
    item_type: string;
    amount: number;
    description: string;
  }>;
}

/**
 * Saves a Zakat calculation snapshot to Supabase:
 *  1. Inserts into zakat_calculations
 *  2. Inserts related items into zakat_calculation_items
 */
export async function saveZakatCalculationApi(
  payload: SaveZakatPayload
): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Insert the main calculation record
    const { data: calc, error: calcError } = await (supabase
      .from('zakat_calculations') as any)
      .insert({
        user_id: user.id,
        rule_set_id: payload.rule_set_id,
        rate_snapshot_id: payload.rate_snapshot_id,
        status: payload.status,
        zakat_anniversary_date: payload.zakat_anniversary_date,
        total_assets: payload.total_assets,
        total_deductions: payload.total_deductions,
        net_zakatable_wealth: payload.net_zakatable_wealth,
        is_eligible: payload.is_eligible,
        estimated_zakat_amount: payload.estimated_zakat_amount,
        currency: payload.currency,
      })
      .select('id')
      .single() as { data: { id: string } | null; error: any };

    if (calcError) throw calcError;
    if (!calc) throw new Error('Failed to insert Zakat calculation');

    // Insert line items (if any)
    if (payload.items.length > 0) {
      const itemRows = payload.items.map((item) => ({
        calculation_id: calc.id,
        item_type: item.item_type,
        amount: item.amount,
        currency: payload.currency,
        description: item.description,
      }));

      const { error: itemsError } = await (supabase
        .from('zakat_calculation_items') as any)
        .insert(itemRows);

      if (itemsError) {
        // Non-fatal: log and continue – the main record is saved
        console.warn('[Zakat] Failed to save calculation items:', itemsError.message);
      }
    }

    return { data: { id: calc.id }, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
