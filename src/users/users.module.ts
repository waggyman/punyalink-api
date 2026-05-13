import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpModule } from '../otp/otp.module';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { Store } from '../stores/stores.entity';
import { UsersAuthService } from './users-auth.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store]),
    OtpModule,
    TenantModule,
    StoreUsersAuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersAuthService],
  exports: [UsersService],
})
export class UsersModule {}
