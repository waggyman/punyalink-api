import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { TemporaryCollection } from '../link-collections/temporary-collection.entity';
import { Link } from '../links/links.entity';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { Store } from '../stores/stores.entity';
import { TenantModule } from '../tenant/tenant.module';
import { User } from '../users/users.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Link,
      Store,
      User,
      TemporaryCollection,
    ]),
    AnalyticsModule,
    MembershipsModule,
    TenantModule,
    StoreUsersAuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
