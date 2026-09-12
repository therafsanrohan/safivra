import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class RealWealthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getEconomicSeries() {
    const { data, error } = await this.supabaseService.getClient()
      .from('economic_series')
      .select('*, observations:economic_observations(*)');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async generateProjection(userId: string, body: any) {
    // Validate that the requested asset belongs to the user
    if (body.assetId) {
      const { data: asset, error } = await this.supabaseService.getClient()
        .from('financial_accounts')
        .select('id, user_id')
        .eq('id', body.assetId)
        .single();
        
      if (error || !asset || asset.user_id !== userId) {
        throw new Error('Unauthorized or invalid asset');
      }
    }

    // Call the engine's projection math or return structured mock for now
    return { success: true, projected_value: body.amount * 1.1 };
  }

  async getSavedScenarios(userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('saved_asset_projections')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
