import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { StoreJwtUser } from '../store-users/store-user.types';
import {
  isMultipartRequest,
  parseMultipartRequest,
} from '../common/multipart/parse-multipart.util';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { StoreUserJwtAuthGuard } from '../store-users/store-user-jwt.guard';
import {
  resolveTenantStore,
  type TenantAwareRequest,
} from '../tenant/tenant-request.util';
import { RequireTenantSubdomainGuard } from '../tenant/guards/require-tenant-subdomain.guard';
import { TenantMatchesUserJwtGuard } from '../tenant/guards/tenant-matches-user-jwt.guard';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
@UsePipes(RequestValidationPipe)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}
  @Get()
  listPlans() {
      return this.membershipsService.listPlans();
  }
  @Get('me')
  @UseGuards(
      RequireTenantSubdomainGuard,
      StoreUserJwtAuthGuard,
      TenantMatchesUserJwtGuard,
  )
  getMyMembership(@Req() req: FastifyRequest) {
      const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
      return this.membershipsService.getStoreMembershipStatus(storeId);
  }
  @Post('purchase-plus')
  @UseGuards(
      RequireTenantSubdomainGuard,
      StoreUserJwtAuthGuard,
      TenantMatchesUserJwtGuard,
  )
  purchasePlus(@Req() req: FastifyRequest) {
      const tenantReq = req as TenantAwareRequest;
      const storeId = resolveTenantStore(tenantReq)!.id;
      const user = req.user as StoreJwtUser;
      return this.membershipsService.purchasePlus(storeId, user.userId);

  }
  @Post('confirm-plus')
  @UseGuards(
      RequireTenantSubdomainGuard,
      StoreUserJwtAuthGuard,
      TenantMatchesUserJwtGuard,
  )
  @UsePipes()
  async confirmPlus(@Req() req: FastifyRequest) {
      const tenantReq = req as TenantAwareRequest;
      const storeId = resolveTenantStore(tenantReq)!.id;
      const user = req.user as StoreJwtUser;
      if (!isMultipartRequest(req)) {
        throw new BadRequestException(
          'Payment receipt must be uploaded as multipart form-data (field: file or image)',
      );
    }
    const { file } = await parseMultipartRequest(req);
    if (!file) {
        throw new BadRequestException('Payment receipt file is required');
    }
    return this.membershipsService.confirmPlus(storeId, user.userId, file);
  }
}
