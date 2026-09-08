import { Controller, Get, UseGuards, Req } from '@nestjs/common';
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
}
