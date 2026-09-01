import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ZakatEngine } from '@safivra/zakat-engine';

@Controller('v1/zakat')
@UseGuards(SupabaseAuthGuard)
export class ZakatController {
  
  @Get('calculate')
  calculateZakat(
    @Query('assets') assets: string,
    @Query('goldPrice') goldPrice: string,
    @Query('silverPrice') silverPrice: string,
    @Query('isLunarYear') isLunarYear: string,
  ) {
    const assetsNum = parseFloat(assets || '0');
    const goldNum = parseFloat(goldPrice || '0');
    const silverNum = parseFloat(silverPrice || '0');
    const lunar = isLunarYear !== 'false';

    const thresholds = ZakatEngine.calculateNisabThresholds(goldNum, silverNum);
    const liability = ZakatEngine.calculateLiability(assetsNum, thresholds.activeNisab, lunar);

    return {
      success: true,
      data: {
        thresholds,
        liability,
        isEligible: assetsNum >= thresholds.activeNisab,
      }
    };
  }
}
