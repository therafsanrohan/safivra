import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { AssetEngine, AssetType } from './engine/asset.engine';

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

    // Call the engine's projection math
    const result = AssetEngine.calculateAssetProjection(
      (body.assetType as AssetType) || 'Cash',
      body.amount || 0,
      body.inflationRate || 0.06,
      body.years || 10,
      body.growthRate
    );

    return { 
      success: true, 
      projected_nominal: result.projectedNominal.toNumber(),
      projected_real: result.projectedReal.toNumber(),
      growth_assumption: result.growthAssumption.toNumber(),
    };
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
    // 1. Calculate Authoritative Deterministic Result
    const deterministicResult = AssetEngine.calculateAssetProjection(
      (body.assetType as AssetType) || 'Cash',
      body.amount || 0,
      body.inflationRate || 0.06,
      body.years || 10,
      body.growthRate
    );

    const baseResponse = {
      owner_id: userId,
      deterministic: {
        current_nominal: deterministicResult.currentNominal.toNumber(),
        projected_nominal: deterministicResult.projectedNominal.toNumber(),
        projected_real: deterministicResult.projectedReal.toNumber(),
        growth_assumption: deterministicResult.growthAssumption.toNumber(),
        inflation_assumption: deterministicResult.inflationAssumption.toNumber(),
        years: deterministicResult.years,
      },
      simulation: null,
      service_available: false,
    };

    // 2. Optional: Python Analytics Advanced Simulation
    const pythonServiceUrl = process.env.PYTHON_ANALYTICS_URL || 'https://analyticsservice-beige.vercel.app';
    const internalApiKey = process.env.INTERNAL_API_KEY || 'dev-secret-key';
    
    const ownedPayload = {
      ...body,
      owner_id: userId,
      deterministic_baseline: baseResponse.deterministic,
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
        return baseResponse; // Fallback to deterministic
      }

      const result = await response.json();
      return { 
        ...baseResponse, 
        simulation: result,
        service_available: true 
      };
    } catch (error) {
      return baseResponse; // Fallback to deterministic on network error
    }
  }
}

