import { Module } from '@nestjs/common';
import { ZakatController } from './zakat.controller';
import { AuthModule } from '../auth/auth.module';
import { ZakatService } from './zakat.service';

@Module({
  imports: [AuthModule],
  controllers: [ZakatController],
  providers: [ZakatService]
})
export class ZakatModule {}
