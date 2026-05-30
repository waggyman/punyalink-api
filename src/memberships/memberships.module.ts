import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsModule } from '../admins/admins.module';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { User } from '../users/users.entity';
import { AdminMembershipsController } from './admin-memberships.controller';
import { MembershipPurchase } from './membership-purchase.entity';
import { MembershipStore } from './membership-store.entity';
import { Membership } from './membership.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Membership,
      MembershipStore,
      MembershipPurchase,
      User,
    ]),
    AdminsModule,
    TenantModule,
    StoreUsersAuthModule,
  ],
  controllers: [MembershipsController, AdminMembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}