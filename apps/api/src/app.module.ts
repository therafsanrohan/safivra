import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgerModule } from './ledger/ledger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ZakatModule } from './zakat/zakat.module';

@Module({
  imports: [LedgerModule, SupabaseModule, ZakatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
