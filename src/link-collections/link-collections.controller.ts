import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { OptionalStoreUserJwtGuard } from '../store-users/optional-store-user-jwt.guard';
import { StoreUserJwtAuthGuard } from '../store-users/store-user-jwt.guard';
import {
  resolveTenantStore,
  resolveTenantSubdomain,
  type TenantAwareRequest,
} from '../tenant/tenant-request.util';
import { RequireTenantSubdomainGuard } from '../tenant/guards/require-tenant-subdomain.guard';
import { TenantMatchesUserJwtGuard } from '../tenant/guards/tenant-matches-user-jwt.guard';
import {
  CreateLinkCollectionDto,
  UpdateLinkCollectionDto,
} from './link-collections.dto';
import { LinkCollectionsService } from './link-collections.service';

@Controller('link-collections')
@UseGuards(RequireTenantSubdomainGuard)
@UsePipes(RequestValidationPipe)
export class LinkCollectionsController {
  constructor(private readonly linkCollectionsService: LinkCollectionsService) {}

  /** Anonymous / optional JWT — expired bundles hidden; anonymous sees active links only. */
  @Get('access/:accessLink')
  @UseGuards(OptionalStoreUserJwtGuard)
  findShared(@Req() req: FastifyRequest, @Param('accessLink') accessLink: string) {
    const tenantReq = req as TenantAwareRequest;
    const subdomain = resolveTenantSubdomain(tenantReq)!;
    return this.linkCollectionsService.findByAccessLinkPublic(
      subdomain,
      accessLink,
      tenantReq,
    );
  }

  @Post()
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  create(
    @Req() req: FastifyRequest,
    @Body() body: CreateLinkCollectionDto,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.linkCollectionsService.create(storeId, body);
  }

  @Get()
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  list(@Req() req: FastifyRequest) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.linkCollectionsService.listAuthorized(storeId);
  }

  @Get(':id')
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  findOne(
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.linkCollectionsService.findOneAuthorized(storeId, id);
  }

  @Patch(':id')
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  update(
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLinkCollectionDto,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.linkCollectionsService.update(storeId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  async remove(
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    await this.linkCollectionsService.remove(storeId, id);
  }
}
