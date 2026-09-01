import { Module } from '@nestjs/common';
import { ZakatController } from './zakat.controller.js';

@Module({
  controllers: [ZakatController]
})
export class ZakatModule {}
