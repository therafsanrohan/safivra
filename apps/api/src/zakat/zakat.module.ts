import { Module } from '@nestjs/common';
import { ZakatController } from './zakat.controller';

@Module({
  controllers: [ZakatController]
})
export class ZakatModule {}
