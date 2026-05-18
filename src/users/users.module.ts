import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpModule } from '../otp/otp.module';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { Store } from '../stores/stores.entity';
import { UsersAuthService } from './users-auth.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { UsersProfileController } from './users-profile.controller';
import { UsersProfileService } from './users-profile.service';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store]),
    OtpModule,
    TenantModule,
    StoreUsersAuthModule,
  ],
  controllers: [UsersController, UsersProfileController],
  providers: [UsersService, UsersAuthService, UsersProfileService],
  exports: [UsersService],
})
export class UsersModule {}
