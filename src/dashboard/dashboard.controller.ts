import { Controller, Get, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { StoreJwtUser } from '../store-users/store-user.types';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { StoreUserJwtAuthGuard } from '../store-users/store-user-jwt.guard';
import {
  resolveTenantStore,
  type TenantAwareRequest,
} from '../tenant/tenant-request.util';
import { RequireTenantSubdomainGuard } from '../tenant/guards/require-tenant-subdomain.guard';
import { TenantMatchesUserJwtGuard } from '../tenant/guards/tenant-matches-user-jwt.guard';
import { DashboardQueryDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(
  RequireTenantSubdomainGuard,
  StoreUserJwtAuthGuard,
  TenantMatchesUserJwtGuard,
)
@UsePipes(RequestValidationPipe)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: FastifyRequest, @Query() query: DashboardQueryDto) {
    const tenantReq = req as TenantAwareRequest;
    const storeId = resolveTenantStore(tenantReq)!.id;
    const user = req.user as StoreJwtUser;
    return this.dashboardService.getDashboard(
      storeId,
      user.userId,
      query.days ?? 30,
    );
  }
}
