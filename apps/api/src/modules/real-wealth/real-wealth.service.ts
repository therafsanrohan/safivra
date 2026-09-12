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

  async generateAdvancedScenario(userId: string, body: any) {
    const pythonServiceUrl = process.env.PYTHON_ANALYTICS_URL || 'https://analyticsservice-beige.vercel.app';
    const internalApiKey = process.env.INTERNAL_API_KEY || 'dev-secret-key';
    
    const ownedPayload = {
      ...body,
      owner_id: userId,
    };

    try {
      const response = await fetch(`${pythonServiceUrl}/v1/real-wealth/scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': internalApiKey,
        },
        body: JSON.stringify(ownedPayload),
      });

      if (!response.ok) {
        return {
          owner_id: userId,
          service_available: false,
          error: await response.text(),
        };
      }

      const result = await response.json();
      return { ...result, service_available: true };
    } catch (error) {
      return {
        owner_id: userId,
        service_available: false,
        error: 'Service unavailable',
      };
    }
  }
}
