import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    StoreUsersAuthModule,
  ],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
