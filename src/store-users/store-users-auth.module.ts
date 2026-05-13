import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';
import { OptionalStoreUserJwtGuard } from './optional-store-user-jwt.guard';
import { StoreUserJwtAuthGuard } from './store-user-jwt.guard';
import { StoreUserJwtStrategy } from './store-user-jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_USER_SECRET'),
      }),
    }),
    TypeOrmModule.forFeature([User, Store]),
  ],
  providers: [
    StoreUserJwtStrategy,
    StoreUserJwtAuthGuard,
    OptionalStoreUserJwtGuard,
  ],
  exports: [
    JwtModule,
    PassportModule,
    StoreUserJwtStrategy,
    StoreUserJwtAuthGuard,
    OptionalStoreUserJwtGuard,
  ],
})
export class StoreUsersAuthModule {}
