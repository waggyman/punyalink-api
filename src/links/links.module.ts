import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { Store } from '../stores/stores.entity';
import { TenantModule } from '../tenant/tenant.module';
import { LinksController } from './links.controller';
import { Link } from './links.entity';
import { LinksService } from './links.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Link, Store]),
    TenantModule,
    AnalyticsModule,
    StoreUsersAuthModule,
    MembershipsModule,
  ],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
