import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { toStoreProfileDto } from '../common/profile/profile-response.util';
import { StoreUserJwtAuthGuard } from '../store-users/store-user-jwt.guard';
import {
  resolveTenantStore,
  resolveTenantSubdomain,
  type TenantAwareRequest,
} from '../tenant/tenant-request.util';
import { RequireTenantSubdomainGuard } from '../tenant/guards/require-tenant-subdomain.guard';
import { TenantMatchesUserJwtGuard } from '../tenant/guards/tenant-matches-user-jwt.guard';
import { UpdateStoreProfileDto } from './stores.dto';
import { StoresService } from './stores.service';

type MultipartRequest = FastifyRequest & {
  file: () => Promise<{
    mimetype: string;
    file: NodeJS.ReadableStream;
  } | undefined>;
};

@Controller('stores')
@UsePipes(RequestValidationPipe)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('subdomain/:subdomain/availability')
  checkSubdomainAvailability(@Param('subdomain') subdomain: string) {
    return this.storesService.checkSubdomainAvailability(subdomain);
  }

  @Get('public')
  @UseGuards(RequireTenantSubdomainGuard)
  async getPublicProfile(@Req() req: FastifyRequest) {
    const subdomain = resolveTenantSubdomain(req as TenantAwareRequest)!;
    return this.storesService.getPublicProfileBySubdomain(subdomain);
  }

  @Get('me')
  @UseGuards(
    RequireTenantSubdomainGuard,
    StoreUserJwtAuthGuard,
    TenantMatchesUserJwtGuard,
  )
  async getMyStore(@Req() req: FastifyRequest) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    const store = await this.storesService.getStoreForOwner(storeId);
    return toStoreProfileDto(store);
  }

  @Patch('me')
  @UseGuards(
    RequireTenantSubdomainGuard,
    StoreUserJwtAuthGuard,
    TenantMatchesUserJwtGuard,
  )
  updateMyStore(
    @Req() req: FastifyRequest,
    @Body() body: UpdateStoreProfileDto,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.storesService.updateProfile(storeId, body);
  }

  @Post('me/background-image')
  @UseGuards(
    RequireTenantSubdomainGuard,
    StoreUserJwtAuthGuard,
    TenantMatchesUserJwtGuard,
  )
  async uploadBackground(@Req() req: FastifyRequest) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    const part = await (req as MultipartRequest).file();
    if (!part) {
      throw new BadRequestException('Image file is required');
    }
    return this.storesService.setBackgroundImage(storeId, part);
  }
}
