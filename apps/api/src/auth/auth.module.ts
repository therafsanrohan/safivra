import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './jwt.strategy';
import { SupabaseAuthGuard } from './auth.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [PassportModule, SupabaseStrategy, SupabaseAuthGuard],
})
export class AuthModule {}
