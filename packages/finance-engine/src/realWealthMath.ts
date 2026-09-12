import Decimal from 'decimal.js';

// Configure decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface ProjectionParams {
  presentValue: number | string | Decimal;
  growthRate: number | string | Decimal; // e.g., 0.10 for 10%
  inflationRate: number | string | Decimal; // e.g., 0.06 for 6%
  years: number;
}

export interface ProjectionResult {
  nominalFutureValue: Decimal;
  realFutureValue: Decimal;
  totalNominalGain: Decimal;
  totalRealGain: Decimal;
  purchasingPowerLoss: Decimal;
}

/**
 * Calculates historical purchasing power equivalence.
 * EquivalentValue = Amount * (CPI_target / CPI_source)
 */
export function calculateHistoricalEquivalent(
  amount: number | string | Decimal,
  cpiSource: number | string | Decimal,
  cpiTarget: number | string | Decimal
): Decimal {
  const amt = new Decimal(amount);
  const src = new Decimal(cpiSource);
  const tgt = new Decimal(cpiTarget);

  if (src.isZero()) {
    throw new Error('CPI source cannot be zero.');
  }

  return amt.times(tgt).dividedBy(src);
}

/**
 * Core projection engine for assets.
 * Handles nominal future value and real future value (inflation adjusted).
 */
export function calculateProjection(params: ProjectionParams): ProjectionResult {
  const pv = new Decimal(params.presentValue);
  const g = new Decimal(params.growthRate);
  const i = new Decimal(params.inflationRate);
  const n = params.years;

  // Nominal FV = PV * (1 + g)^n
  const growthFactor = new Decimal(1).plus(g).pow(n);
  const nominalFv = pv.times(growthFactor);

  // Inflation Factor = (1 + i)^n
  const inflationFactor = new Decimal(1).plus(i).pow(n);

  // Real FV = Nominal FV / Inflation Factor
  const realFv = inflationFactor.isZero() ? new Decimal(0) : nominalFv.dividedBy(inflationFactor);

  const totalNominalGain = nominalFv.minus(pv);
  const totalRealGain = realFv.minus(pv);

  // Purchasing power loss calculation (primarily for cash or low yield)
  // How much purchasing power is lost on the nominal amount due to inflation?
  // Current equivalent of nominal FV = nominalFv / inflationFactor = realFv
  // Loss = nominalFv - realFv? No, usually it's PV - (PV / inflationFactor) for cash.
  // We define it as PV - RealFV (if Growth is 0, this is pure loss).
  // E.g., PV = 1,000,000, i = 7%, n = 10 -> IF = 1.967
  // realFV = 1,000,000 / 1.967 = 508,349. Loss = PV - realFV = 491,651
  const purchasingPowerLoss = pv.minus(realFv);

  return {
    nominalFutureValue: nominalFv,
    realFutureValue: realFv,
    totalNominalGain,
    totalRealGain,
    purchasingPowerLoss,
  };
}

/**
 * Calculates Real Return
 * RealReturn = (1 + nominalReturn) / (1 + inflationRate) - 1
 */
export function calculateRealReturn(
  nominalReturn: number | string | Decimal,
  inflationRate: number | string | Decimal
): Decimal {
  const nR = new Decimal(nominalReturn);
  const iR = new Decimal(inflationRate);

  const num = new Decimal(1).plus(nR);
  const den = new Decimal(1).plus(iR);

  if (den.isZero()) {
    throw new Error('Denominator for real return cannot be zero (inflation = -100%).');
  }

  return num.dividedBy(den).minus(1);
}

/**
 * Calculates CAGR
 * CAGR = (EndingValue / BeginningValue)^(1/n) - 1
 */
export function calculateCAGR(
  beginningValue: number | string | Decimal,
  endingValue: number | string | Decimal,
  years: number
): Decimal {
  const bv = new Decimal(beginningValue);
  const ev = new Decimal(endingValue);

  if (bv.isZero()) {
    throw new Error('Beginning value cannot be zero for CAGR.');
  }

  if (years === 0) {
    return new Decimal(0);
  }

  const ratio = ev.dividedBy(bv);
  // Using Math.pow since Decimal.js pow doesn't support fractional exponents directly in basic mode
  // But wait, decimal.js DOES support fractional exponents if precision is set (which it is, but requires care)
  // Decimal.pow requires the exponent to be a Decimal if it's fractional? Actually, decimal.js pow handles numbers.
  const cagr = ratio.pow(1 / years).minus(1);
  return cagr;
}

/**
 * Future Purchasing Power Requirement
 * FutureRequiredAmount = CurrentPurchasingPower * (1 + i)^n
 */
export function calculateFutureRequiredAmount(
  currentPurchasingPower: number | string | Decimal,
  inflationRate: number | string | Decimal,
  years: number
): Decimal {
  const pv = new Decimal(currentPurchasingPower);
  const i = new Decimal(inflationRate);
  
  const inflationFactor = new Decimal(1).plus(i).pow(years);
  return pv.times(inflationFactor);
}
