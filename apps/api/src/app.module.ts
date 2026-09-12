import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgerModule } from './ledger/ledger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ZakatModule } from './zakat/zakat.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RealWealthModule } from './modules/real-wealth/real-wealth.module';

@Module({
  imports: [LedgerModule, SupabaseModule, ZakatModule, AnalyticsModule, RealWealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
