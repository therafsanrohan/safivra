import { Module } from '@nestjs/common';
import { ZakatController } from './zakat.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ZakatController]
})
export class ZakatModule {}
