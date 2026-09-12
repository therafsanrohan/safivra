import Decimal from 'decimal.js';
import { FinanceEngine } from './finance.engine';

export type AssetType =
  | 'Cash'
  | 'Bank'
  | 'FDR'
  | 'DPS'
  | 'Land'
  | 'Flat'
  | 'House'
  | 'Commercial'
  | 'Gold'
  | 'Silver'
  | 'Stocks'
  | 'Vehicle'
  | 'Custom';

export interface AssetProjectionResult {
  assetType: AssetType;
  currentNominal: Decimal;
  projectedNominal: Decimal;
  projectedReal: Decimal;
  growthAssumption: Decimal;
  inflationAssumption: Decimal;
  years: number;
}

export class AssetEngine {
  /**
   * Evaluates the projection for an individual asset based on its type-specific rules.
   */
  static calculateAssetProjection(
    assetType: AssetType,
    currentValue: number | string | Decimal,
    inflationRate: number | string | Decimal,
    years: number,
    customGrowthRate?: number | string | Decimal // Override for specific assets
  ): AssetProjectionResult {
    let growthAssumption = new Decimal(0);

    // Asset-specific growth rules
    switch (assetType) {
      case 'Cash':
        growthAssumption = new Decimal(0); // Cash earns no interest
        break;
      case 'Bank':
      case 'FDR':
      case 'DPS':
        growthAssumption = new Decimal(customGrowthRate ?? 0.05); // Default to some small yield if not provided
        break;
      case 'Land':
      case 'Flat':
      case 'House':
      case 'Commercial':
        growthAssumption = new Decimal(customGrowthRate ?? 0.08); // Real estate appreciation separate from inflation
        break;
      case 'Gold':
      case 'Silver':
        growthAssumption = new Decimal(customGrowthRate ?? 0.06); 
        break;
      case 'Stocks':
        growthAssumption = new Decimal(customGrowthRate ?? 0.10);
        break;
      case 'Vehicle':
        growthAssumption = new Decimal(customGrowthRate ?? -0.08); // Depreciation
        break;
      case 'Custom':
      default:
        growthAssumption = new Decimal(customGrowthRate ?? 0.0);
        break;
    }

    const projectedNominal = FinanceEngine.calculateFutureNominalValue(
      currentValue,
      growthAssumption,
      years
    );

    const projectedReal = FinanceEngine.calculateRealFutureValue(
      projectedNominal,
      inflationRate,
      years
    );

    return {
      assetType,
      currentNominal: new Decimal(currentValue),
      projectedNominal,
      projectedReal,
      growthAssumption,
      inflationAssumption: new Decimal(inflationRate),
      years,
    };
  }

  /**
   * Portfolio Projection
   * Aggregates multiple asset projections into a single summary.
   */
  static calculatePortfolioProjection(
    assets: { type: AssetType; value: number | string | Decimal; growth?: number | string | Decimal }[],
    inflationRate: number | string | Decimal,
    years: number
  ) {
    const results = assets.map((a) =>
      this.calculateAssetProjection(a.type, a.value, inflationRate, years, a.growth)
    );

    const totalCurrentNominal = results.reduce((acc, r) => acc.add(r.currentNominal), new Decimal(0));
    const totalProjectedNominal = results.reduce((acc, r) => acc.add(r.projectedNominal), new Decimal(0));
    const totalProjectedReal = results.reduce((acc, r) => acc.add(r.projectedReal), new Decimal(0));

    // Inflation Drag: Difference between nominal projection and real projection
    const inflationDrag = totalProjectedNominal.sub(totalProjectedReal);

    // Assets beating inflation: Where asset growth > inflation
    const inf = new Decimal(inflationRate);
    const assetsBeatingInflation = results.filter((r) => r.growthAssumption.gt(inf));

    return {
      assets: results,
      totalCurrentNominal,
      totalProjectedNominal,
      totalProjectedReal,
      inflationDrag,
      assetsBeatingInflationCount: assetsBeatingInflation.length,
    };
  }
}
