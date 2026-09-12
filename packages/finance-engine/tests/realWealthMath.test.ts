import { describe, it, expect } from 'vitest';
import {
  calculateHistoricalEquivalent,
  calculateProjection,
  calculateRealReturn,
  calculateCAGR,
  calculateFutureRequiredAmount,
} from '../src/realWealthMath';
import Decimal from 'decimal.js';

describe('Real Wealth Math Engine', () => {
  describe('Reference Test', () => {
    it('calculates 5,000,000 at 10% growth and 6% inflation over 10 years correctly', () => {
      const result = calculateProjection({
        presentValue: 5000000,
        growthRate: 0.10,
        inflationRate: 0.06,
        years: 10,
      });

      // Expected nominal: 5,000,000 * (1.10)^10 = 12,968,712.3005
      expect(result.nominalFutureValue.toNumber()).toBeCloseTo(12968712.30, 2);

      // Expected real: 12,968,712.30 / (1.06)^10 = 12,968,712.30 / 1.790847... = 7,241,661
      expect(result.realFutureValue.toNumber()).toBeCloseTo(7241661, 0);
    });
  });

  describe('Cash Test', () => {
    it('calculates 1,000,000 cash at 0% growth and 7% inflation over 10 years', () => {
      const result = calculateProjection({
        presentValue: 1000000,
        growthRate: 0,
        inflationRate: 0.07,
        years: 10,
      });

      expect(result.nominalFutureValue.toNumber()).toBe(1000000);
      // Real: 1,000,000 / (1.07)^10 = 1,000,000 / 1.96715 = 508,349.29
      expect(result.realFutureValue.toNumber()).toBeCloseTo(508349.29, 2);
      expect(result.purchasingPowerLoss.toNumber()).toBeCloseTo(491650.71, 2);
    });
  });

  describe('Historical Purchasing Power (CPI Test)', () => {
    it('calculates equivalent value based on CPI change', () => {
      const equivalent = calculateHistoricalEquivalent(1000000, 120, 150);
      expect(equivalent.toNumber()).toBe(1250000);
    });
  });

  describe('Real Return', () => {
    it('calculates real return correctly', () => {
      const realReturn = calculateRealReturn(0.10, 0.06);
      // (1.10 / 1.06) - 1 = 1.037735... - 1 = 0.037735
      expect(realReturn.toNumber()).toBeCloseTo(0.037735, 5);
    });
  });

  describe('CAGR', () => {
    it('calculates CAGR correctly', () => {
      const cagr = calculateCAGR(1000, 2000, 5);
      // (2000/1000)^(1/5) - 1 = 2^(0.2) - 1 = 1.148698 - 1 = 14.87%
      expect(cagr.toNumber()).toBeCloseTo(0.148698, 5);
    });
  });

  describe('Future Target Tool', () => {
    it('calculates future required amount correctly', () => {
      const futureReq = calculateFutureRequiredAmount(5000000, 0.06, 10);
      // 5000000 * (1.06)^10 = 8,954,238.48
      expect(futureReq.toNumber()).toBeCloseTo(8954238.48, 2);
    });
  });
});
