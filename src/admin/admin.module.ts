import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsModule } from '../admins/admins.module';
import { TemporaryCollection } from '../link-collections/temporary-collection.entity';
import { Link } from '../links/links.entity';
import { MembershipPurchase } from '../memberships/membership-purchase.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';
import { AdminPurchasesController } from './admin-purchases.controller';
import { AdminPurchasesService } from './admin-purchases.service';
import { AdminStoresController } from './admin-stores.controller';
import { AdminStoresService } from './admin-stores.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      User,
      Link,
      TemporaryCollection,
      MembershipPurchase,
    ]),
    MembershipsModule,
    AdminsModule,
  ],
  controllers: [AdminStoresController, AdminPurchasesController],
  providers: [AdminStoresService, AdminPurchasesService],
})
export class AdminPanelModule {}
