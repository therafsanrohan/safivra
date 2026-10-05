import { supabase } from '@/lib/supabase/client';

export type DataCompleteness = 'complete' | 'partial' | 'insufficient';

export interface WealthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  semiLiquidAssets: number;
  investmentAssets: number;
  lockedAssets: number;
  preciousMetalValue: number;
  dataCompleteness: DataCompleteness;
}

/**
 * Client-side wealth engine that fetches the classified wealth summary
 * from the v_wealth_summary database view.
 * 
 * No fabrication: returns exactly what the database calculates based on live user data.
 */
export async function fetchRealWealthSummary(userId: string): Promise<WealthSummary | null> {
  if (!userId) return null;

  try {
    const { data, error } = await (supabase.from('v_wealth_summary') as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[WealthEngine] Error fetching wealth summary:', error);
      return null;
    }

    if (!data) {
      // Return zeroed summary with insufficient completeness
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        liquidAssets: 0,
        semiLiquidAssets: 0,
        investmentAssets: 0,
        lockedAssets: 0,
        preciousMetalValue: 0,
        dataCompleteness: 'insufficient',
      };
    }

    return {
      totalAssets: Number(data.total_assets) || 0,
      totalLiabilities: Number(data.total_liabilities) || 0,
      netWorth: Number(data.net_worth) || 0,
      liquidAssets: Number(data.liquid_assets) || 0,
      semiLiquidAssets: Number(data.semi_liquid_assets) || 0,
      investmentAssets: Number(data.investment_assets) || 0,
      lockedAssets: Number(data.locked_assets) || 0,
      preciousMetalValue: Number(data.precious_metal_value) || 0,
      dataCompleteness: data.data_completeness as DataCompleteness,
    };
  } catch (err) {
    console.error('[WealthEngine] Unexpected error:', err);
    return null;
  }
}
