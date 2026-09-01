import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LedgerModule } from './ledger/ledger.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { ZakatModule } from './zakat/zakat.module.js';

@Module({
  imports: [LedgerModule, SupabaseModule, ZakatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
