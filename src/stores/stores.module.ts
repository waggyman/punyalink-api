import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreUsersAuthModule } from '../store-users/store-users-auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { StoresController } from './stores.controller';
import { Store } from './stores.entity';
import { User } from '../users/users.entity';
import { StoresService } from './stores.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, User]),
    TenantModule,
    StoreUsersAuthModule,
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
