export class ZakatEngine {
  private static readonly ZAKAT_RATE_LUNAR = 0.025; // 2.5% for lunar year
  private static readonly ZAKAT_RATE_SOLAR = 0.02577; // ~2.577% for solar year
  private static readonly NISAB_GOLD_GRAMS = 85;
  private static readonly NISAB_SILVER_GRAMS = 595;

  /**
   * Calculates the current Nisab threshold values based on current gold/silver prices per gram
   * @param goldPricePerGram Current price of 1g of Gold in base currency
   * @param silverPricePerGram Current price of 1g of Silver in base currency
   * @returns Nisab thresholds
   */
  public static calculateNisabThresholds(goldPricePerGram: number, silverPricePerGram: number) {
    if (goldPricePerGram <= 0 || silverPricePerGram <= 0) {
      throw new Error('Prices must be positive numbers');
    }

    const goldNisab = goldPricePerGram * this.NISAB_GOLD_GRAMS;
    const silverNisab = silverPricePerGram * this.NISAB_SILVER_GRAMS;

    return {
      goldNisab,
      silverNisab,
      // Typically, the lowest value is used for calculating Nisab for currency/savings to be safer/more generous
      activeNisab: Math.min(goldNisab, silverNisab),
    };
  }

  /**
   * Calculates the Zakat liability for a given amount of eligible assets
   * @param eligibleAssets The total value of zakatable assets after deducting immediate liabilities
   * @param activeNisab The active Nisab threshold (e.g. from silver)
   * @param isLunarYear true if calculating based on Hijri year (default), false for Gregorian
   * @returns The amount of Zakat due
   */
  public static calculateLiability(eligibleAssets: number, activeNisab: number, isLunarYear = true): number {
    if (eligibleAssets < activeNisab) {
      return 0; // Below Nisab, no Zakat due
    }

    const rate = isLunarYear ? this.ZAKAT_RATE_LUNAR : this.ZAKAT_RATE_SOLAR;
    return eligibleAssets * rate;
  }
}
