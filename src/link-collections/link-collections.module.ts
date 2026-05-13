import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from '../links/links.entity';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { Store } from '../stores/stores.entity';
import { TenantModule } from '../tenant/tenant.module';
import { LinkCollectionMembership } from './link-collection-membership.entity';
import { LinkCollectionsController } from './link-collections.controller';
import { LinkCollectionsService } from './link-collections.service';
import { TemporaryCollection } from './temporary-collection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TemporaryCollection,
      LinkCollectionMembership,
      Link,
      Store,
    ]),
    TenantModule,
    StoreUsersAuthModule,
  ],
  controllers: [LinkCollectionsController],
  providers: [LinkCollectionsService],
})
export class LinkCollectionsModule {}
