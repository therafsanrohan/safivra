import Decimal from 'decimal.js';

// Configure Decimal.js to use proper precision and rounding for financial apps
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class FinanceEngine {
  /**
   * Calculate Historical Equivalent Value (Purchasing Power)
   * Formula: Amount(sourceDate) × (CPI(targetDate) / CPI(sourceDate))
   */
  static calculateHistoricalEquivalentValue(
    amount: number | string | Decimal,
    sourceCPI: number | string | Decimal,
    targetCPI: number | string | Decimal,
  ): Decimal {
    const amt = new Decimal(amount);
    const src = new Decimal(sourceCPI);
    const tgt = new Decimal(targetCPI);
    
    if (src.isZero()) throw new Error('Source CPI cannot be zero');
    
    return amt.mul(tgt).div(src);
  }

  /**
   * Future Nominal Value (Constant Annual Growth)
   * Formula: FV = PV × (1 + g)^n
   */
  static calculateFutureNominalValue(
    currentValue: number | string | Decimal,
    growthRate: number | string | Decimal,
    years: number,
  ): Decimal {
    const pv = new Decimal(currentValue);
    const g = new Decimal(growthRate);
    const multiplier = new Decimal(1).add(g).pow(years);
    return pv.mul(multiplier);
  }

  /**
   * Future Inflation Factor (Constant Inflation)
   * Formula: InflationFactor = (1 + i)^n
   */
  static calculateInflationFactor(
    inflationRate: number | string | Decimal,
    years: number,
  ): Decimal {
    const i = new Decimal(inflationRate);
    return new Decimal(1).add(i).pow(years);
  }

  /**
   * Real Future Value (Purchasing Power in today's terms)
   * Formula: RealFutureValue = NominalFutureValue / InflationFactor
   */
  static calculateRealFutureValue(
    nominalFutureValue: number | string | Decimal,
    inflationRate: number | string | Decimal,
    years: number,
  ): Decimal {
    const nfv = new Decimal(nominalFutureValue);
    const factor = this.calculateInflationFactor(inflationRate, years);
    return nfv.div(factor);
  }

  /**
   * Real Return
   * Formula: RealReturn = (1 + nominalReturn) / (1 + inflationRate) - 1
   */
  static calculateRealReturn(
    nominalReturn: number | string | Decimal,
    inflationRate: number | string | Decimal,
  ): Decimal {
    const n = new Decimal(nominalReturn);
    const i = new Decimal(inflationRate);
    
    const num = new Decimal(1).add(n);
    const den = new Decimal(1).add(i);
    return num.div(den).sub(1);
  }

  /**
   * Compound Annual Growth Rate (CAGR)
   * Formula: CAGR = (EndingValue / BeginningValue)^(1/n) - 1
   */
  static calculateCAGR(
    beginningValue: number | string | Decimal,
    endingValue: number | string | Decimal,
    years: number,
  ): Decimal {
    const bv = new Decimal(beginningValue);
    const ev = new Decimal(endingValue);
    
    if (bv.isZero()) {
      return new Decimal(0); // Cannot calculate CAGR from zero gracefully without infinity
    }
    if (years <= 0) {
      return new Decimal(0);
    }

    // Since decimal.js doesn't have a fractional root built-in easily for arbitrary numbers,
    // we use standard Math for the exponentiation if it's safe, but let's use Decimal's root or exp.
    // decimal.js handles fractional powers in .pow() if the base is positive!
    
    const ratio = ev.div(bv);
    if (ratio.isNegative()) {
       throw new Error('Cannot calculate CAGR with negative ratio');
    }
    
    const exp = new Decimal(1).div(years);
    return ratio.pow(exp).sub(1);
  }

  /**
   * Purchasing Power Loss (For cash that earns no return)
   * PurchasingPowerLoss = 1 - (RealFutureCash / CurrentCash)
   */
  static calculatePurchasingPowerLoss(
    currentCash: number | string | Decimal,
    inflationRate: number | string | Decimal,
    years: number,
  ): Decimal {
    const cash = new Decimal(currentCash);
    if (cash.isZero()) return new Decimal(0);
    
    // For pure cash, nominal future value is exactly currentCash (growth = 0)
    const realFutureCash = this.calculateRealFutureValue(cash, inflationRate, years);
    const loss = new Decimal(1).sub(realFutureCash.div(cash));
    return loss;
  }

  /**
   * Future Required Amount
   * Formula: FutureRequiredAmount = CurrentAmount × InflationFactor
   */
  static calculateFutureRequiredAmount(
    currentAmount: number | string | Decimal,
    inflationRate: number | string | Decimal,
    years: number,
  ): Decimal {
    const amt = new Decimal(currentAmount);
    const factor = this.calculateInflationFactor(inflationRate, years);
    return amt.mul(factor);
  }
}
