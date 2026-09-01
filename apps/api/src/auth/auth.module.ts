import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './jwt.strategy';
import { SupabaseAuthGuard } from './auth.guard';

@Module({
  imports: [PassportModule],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [SupabaseStrategy, SupabaseAuthGuard],
})
export class AuthModule {}
