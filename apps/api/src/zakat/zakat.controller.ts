import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ZakatEngine } from '@safivra/zakat-engine';
import { ZakatService, SaveCalculationDto } from './zakat.service';

@Controller('v1/zakat')
@UseGuards(SupabaseAuthGuard)
export class ZakatController {
  
  constructor(private readonly zakatService: ZakatService) {}

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

  @Post('calculations')
  async saveCalculation(
    @Req() request: any,
    @Body() body: SaveCalculationDto,
  ) {
    const userId = request.user.userId;
    const calc = await this.zakatService.saveCalculation(userId, body);
    return {
      success: true,
      data: calc
    };
  }

  @Get('calculations')
  async getCalculations(@Req() request: any) {
    const userId = request.user.userId;
    const calculations = await this.zakatService.getCalculations(userId);
    return {
      success: true,
      data: calculations
    };
  }
}
