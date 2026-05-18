import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
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
import { CreateLinkDto, UpdateLinkDto } from './links.dto';
import { ListLinksQueryDto } from './links-list-query.dto';
import { LinksService } from './links.service';

@Controller('links')
@UseGuards(RequireTenantSubdomainGuard)
@UsePipes(RequestValidationPipe)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  @UseGuards(OptionalStoreUserJwtGuard)
  list(@Req() req: FastifyRequest, @Query() query: ListLinksQueryDto) {
    const tenantReq = req as TenantAwareRequest;
    const subdomain = resolveTenantSubdomain(tenantReq)!;
    return this.linksService.listForTenant(subdomain, tenantReq, query);
  }

  /** Public landing by short slug; increments `view`. */
  @Get('access/:accessLink')
  @UseGuards(OptionalStoreUserJwtGuard)
  resolveByAccess(
    @Req() req: FastifyRequest,
    @Param('accessLink') accessLink: string,
  ) {
    const tenantReq = req as TenantAwareRequest;
    const subdomain = resolveTenantSubdomain(tenantReq)!;
    return this.linksService.resolveByAccessLink(
      subdomain,
      accessLink,
      tenantReq,
    );
  }

  /** Visit endpoint for direct redirect; increments `click` and returns destination URL. */
  @Post('access/:accessLink/visit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalStoreUserJwtGuard)
  visit(
    @Req() req: FastifyRequest,
    @Param('accessLink') accessLink: string,
  ) {
    const tenantReq = req as TenantAwareRequest;
    const subdomain = resolveTenantSubdomain(tenantReq)!;
    return this.linksService.visitByAccessLink(
      subdomain,
      accessLink,
      tenantReq,
    );
  }

  @Post()
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  create(@Req() req: FastifyRequest, @Body() body: CreateLinkDto) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.linksService.createForStore(storeId, body);
  }

  @Get(':id')
  @UseGuards(OptionalStoreUserJwtGuard)
  getOne(@Req() req: FastifyRequest, @Param('id', ParseUUIDPipe) id: string) {
    const tenantReq = req as TenantAwareRequest;
    const subdomain = resolveTenantSubdomain(tenantReq)!;
    return this.linksService.findOneForTenant(subdomain, id, tenantReq);
  }

  @Patch(':id')
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  update(
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLinkDto,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    return this.linksService.updateForStore(storeId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(StoreUserJwtAuthGuard, TenantMatchesUserJwtGuard)
  async remove(
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    await this.linksService.removeForStore(storeId, id);
  }
}
