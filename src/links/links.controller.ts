import {
  BadRequestException,
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
import {
  isMultipartRequest,
  parseMultipartRequest,
} from '../common/multipart/parse-multipart.util';
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
import {
  multipartToCreateLinkPlain,
  multipartToUpdateLinkPlain,
  validateCreateLinkDto,
  validateUpdateLinkDto,
} from './links-validation.util';

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
  @UsePipes()
  async create(@Req() req: FastifyRequest) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    if (isMultipartRequest(req)) {
      const { fields, file } = await parseMultipartRequest(req);
      const dto = await validateCreateLinkDto(
        multipartToCreateLinkPlain(fields),
      );
      return this.linksService.createForStore(storeId, dto, file);
    }
    const dto = await validateCreateLinkDto(
      (req.body ?? {}) as Record<string, unknown>,
    );
    return this.linksService.createForStore(storeId, dto);
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
  @UsePipes()
  async update(
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const storeId = resolveTenantStore(req as TenantAwareRequest)!.id;
    if (isMultipartRequest(req)) {
      const { fields, file } = await parseMultipartRequest(req);
      const plain = multipartToUpdateLinkPlain(fields);
      if (!file && Object.keys(plain).length === 0) {
        throw new BadRequestException(
          'Provide at least one field, an image file, or removeImage',
        );
      }
      const dto = await validateUpdateLinkDto(plain);
      return this.linksService.updateForStore(storeId, id, dto, file);
    }
    const dto = await validateUpdateLinkDto(
      (req.body ?? {}) as Record<string, unknown>,
    );
    return this.linksService.updateForStore(storeId, id, dto);
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
