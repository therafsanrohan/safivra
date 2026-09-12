import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { RealWealthService } from './real-wealth.service';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import type { Request } from 'express';

@Controller('real-wealth')
@UseGuards(SupabaseAuthGuard)
export class RealWealthController {
  constructor(private readonly realWealthService: RealWealthService) {}

  @Get('economic-series')
  async getEconomicSeries() {
    return this.realWealthService.getEconomicSeries();
  }

  @Post('projections')
  async generateProjection(@Req() req: Request, @Body() body: any) {
    // We enforce user_id on the backend to prevent cross-user attacks
    const userId = (req.user as any).sub;
    return this.realWealthService.generateProjection(userId, body);
  }

  @Get('saved-scenarios')
  async getSavedScenarios(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.realWealthService.getSavedScenarios(userId);
  }
}
