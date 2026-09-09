import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('v1/analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('insights')
  async getInsights(@Req() request: any) {
    const userId = request.user.userId;
    return this.analyticsService.getFinancialInsights(userId);
  }

  /**
   * POST /v1/analytics/scenario
   * Calculates a spending scenario for the authenticated user.
   * The owner_id in the body is always overridden with the authenticated user's ID.
   * The scenario engine is read-only — no ledger or balance is touched.
   */
  @Post('scenario')
  async calculateScenario(@Req() request: any, @Body() body: Record<string, unknown>) {
    const userId = request.user.userId;
    return this.analyticsService.calculateScenario(userId, body);
  }
}
