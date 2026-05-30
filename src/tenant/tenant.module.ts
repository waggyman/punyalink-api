import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../stores/stores.entity';
import { RequireTenantSubdomainGuard } from './guards/require-tenant-subdomain.guard';
import { TenantMatchesUserJwtGuard } from './guards/tenant-matches-user-jwt.guard';
import { TenantMiddleware } from './tenant.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  providers: [
    TenantMiddleware,
    RequireTenantSubdomainGuard,
    TenantMatchesUserJwtGuard,
  ],
  exports: [
    TypeOrmModule,
    TenantMiddleware,
    RequireTenantSubdomainGuard,
    TenantMatchesUserJwtGuard,
  ],
})
export class TenantModule {}
