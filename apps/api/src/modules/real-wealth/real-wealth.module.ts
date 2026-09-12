import { Module } from '@nestjs/common';
import { RealWealthController } from './real-wealth.controller';
import { RealWealthService } from './real-wealth.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [RealWealthController],
  providers: [RealWealthService],
  exports: [RealWealthService],
})
export class RealWealthModule {}
