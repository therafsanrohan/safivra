import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface SaveCalculationDto {
  rule_set_id: string;
  rate_snapshot_id: string;
  status: 'draft' | 'confirmed_snapshot';
  zakat_anniversary_date: string;
  total_assets: number;
  total_deductions: number;
  net_zakatable_wealth: number;
  is_eligible: boolean;
  estimated_zakat_amount: number;
  currency: string;
  items: any[];
}

@Injectable()
export class ZakatService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async saveCalculation(userId: string, dto: SaveCalculationDto) {
    const supabase = this.supabaseService.getClient();

    const { items, ...calcData } = dto;

    const { data: calc, error: calcError } = await supabase
      .from('zakat_calculations')
      .insert({
        user_id: userId,
        ...calcData
      })
      .select()
      .single();

    if (calcError) {
      throw new InternalServerErrorException(calcError.message);
    }

    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        calculation_id: calc.id
      }));

      const { error: itemsError } = await supabase
        .from('zakat_calculation_items')
        .insert(itemsToInsert);

      if (itemsError) {
        throw new InternalServerErrorException(itemsError.message);
      }
    }

    return calc;
  }

  async getCalculations(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('zakat_calculations')
      .select('*, zakat_calculation_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
