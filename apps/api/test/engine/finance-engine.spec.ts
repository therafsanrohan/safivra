import { expect, test, describe } from 'vitest';
import { FinanceEngine } from '../../src/modules/real-wealth/engine/finance.engine';
import Decimal from 'decimal.js';

describe('FinanceEngine Deterministic Tests', () => {

  /**
   * TEST A
   * PV: 5,000,000 | Growth: 10% | Inflation: 6% | Years: 10
   * Nominal FV: approximately 12,968,712.30
   * Real FV: approximately 7,241,661
   */
  test('TEST A: Future Nominal & Real Value', () => {
    const pv = 5000000;
    const growth = 0.10;
    const inflation = 0.06;
    const years = 10;

    const nominalFv = FinanceEngine.calculateFutureNominalValue(pv, growth, years);
    expect(nominalFv.toDP(2).toNumber()).toBe(12968712.30);

    const realFv = FinanceEngine.calculateRealFutureValue(nominalFv, inflation, years);
    // 12968712.30 / (1.06^10) = 12968712.30 / 1.790847... = 7241660.99... rounds to 7241661
    expect(Math.round(realFv.toNumber())).toBe(7241661);
  });

  /**
   * TEST B
   * Cash: 1,000,000 | Growth: 0% | Inflation: 7% | Years: 10
   * Real purchasing power: approximately 508,349
   * Purchasing-power loss: approximately 49.17%
   */
  test('TEST B: Cash Purchasing Power Erosion', () => {
    const cash = 1000000;
    const growth = 0.00;
    const inflation = 0.07;
    const years = 10;

    const nominalFv = FinanceEngine.calculateFutureNominalValue(cash, growth, years);
    expect(nominalFv.toNumber()).toBe(cash); // Cash earns no nominal return

    const realPower = FinanceEngine.calculateRealFutureValue(nominalFv, inflation, years);
    expect(Math.round(realPower.toNumber())).toBe(508349);

    const loss = FinanceEngine.calculatePurchasingPowerLoss(cash, inflation, years);
    expect(loss.mul(100).toDP(2).toNumber()).toBe(49.17); // 49.17%
  });

  /**
   * TEST C
   * CPI Source: 120 | CPI Target: 150 | Amount: 1,000,000
   * Equivalent: 1,250,000
   */
  test('TEST C: CPI Equivalent', () => {
    const amount = 1000000;
    const cpiSource = 120;
    const cpiTarget = 150;

    const equivalent = FinanceEngine.calculateHistoricalEquivalentValue(amount, cpiSource, cpiTarget);
    expect(equivalent.toNumber()).toBe(1250000);
  });

  /**
   * TEST D
   * Nominal Return: 10% | Inflation: 6%
   * Real Return: approximately 3.7735849%
   */
  test('TEST D: Real Return', () => {
    const nominalReturn = 0.10;
    const inflation = 0.06;

    const realReturn = FinanceEngine.calculateRealReturn(nominalReturn, inflation);
    // (1.10 / 1.06) - 1 = 0.037735849...
    expect(realReturn.mul(100).toDP(7).toNumber()).toBe(3.7735849);
  });

});
