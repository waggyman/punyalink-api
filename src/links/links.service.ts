import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics/analytics.service';
import { ImageStorageService } from '../common/images/image-storage.service';
import type { MultipartUploadFile } from '../common/multipart/parse-multipart.util';
import { MembershipsService } from '../memberships/memberships.service';
import type { TenantAwareRequest } from '../tenant/tenant-request.util';
import { Store } from '../stores/stores.entity';
import { CreateLinkDto, UpdateLinkDto } from './links.dto';
import { Link } from './links.entity';
import { toLinkDto, toLinkDtoList, toPaginatedLinksResponse } from './link-response.util';
import {
  ListLinksQueryDto,
  resolveLinksPagination,
} from './links-list-query.dto';

@Injectable()
export class LinksService {
  private static readonly ACCESS_LINK_PATTERN = /^[a-z0-9-]+$/;
  private static readonly ACCESS_LINK_LENGTH = 12;
  private static readonly ACCESS_LINK_ALPHABET =
    'abcdefghijklmnopqrstuvwxyz0123456789-';

  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    private readonly analyticsService: AnalyticsService,
    private readonly imageStorage: ImageStorageService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async listForTenant(
    subdomain: string,
    req: TenantAwareRequest,
    query: ListLinksQueryDto = {},
  ) {
    const storeId = await this.resolveStoreIdBySubdomain(subdomain);
    if (req.optionalStoreUserAuth) {
      return this.listAuthorized(storeId, query);
    }
    return this.listPublic(storeId, query);
  }

  private async listPublic(storeId: string, query: ListLinksQueryDto) {
    const qb = this.linksRepository
      .createQueryBuilder('link')
      .where('link.store_id = :storeId', { storeId })
      .andWhere('link.is_public = true')
      .andWhere('link.is_active = true');

    this.applyListFilters(qb, query);
    qb.orderBy('link.created_at', 'DESC');

    return this.paginateQuery(qb, query);
  }

  private async listAuthorized(storeId: string, query: ListLinksQueryDto) {
    const qb = this.linksRepository
      .createQueryBuilder('link')
      .where('link.store_id = :storeId', { storeId });

    this.applyListFilters(qb, query);

    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';
    const column =
      sortBy === 'click'
        ? 'link.click'
        : sortBy === 'view'
          ? 'link.view'
          : 'link.created_at';
    qb.orderBy(column, order);

    return this.paginateQuery(qb, query);
  }

  private applyListFilters(
    qb: ReturnType<Repository<Link>['createQueryBuilder']>,
    query: ListLinksQueryDto,
  ) {
    this.applySearch(qb, query.search);
    if (query.isPublic !== undefined) {
      qb.andWhere('link.is_public = :isPublic', { isPublic: query.isPublic });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('link.is_active = :isActive', { isActive: query.isActive });
    }
  }

  private async paginateQuery(
    qb: ReturnType<Repository<Link>['createQueryBuilder']>,
    query: ListLinksQueryDto,
  ) {
    const { page, limit, skip } = resolveLinksPagination(query);
    const [links, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return toPaginatedLinksResponse(links, total, page, limit);
  }

  private applySearch(
    qb: ReturnType<Repository<Link>['createQueryBuilder']>,
    search?: string,
  ) {
    const term = search?.trim();
    if (!term) {
      return;
    }
    qb.andWhere(
      '(link.name ILIKE :term OR link.access_link ILIKE :term OR link.external_link ILIKE :term)',
      { term: `%${term}%` },
    );
  }

  async findOneForTenant(
    subdomain: string,
    linkId: string,
    req: TenantAwareRequest,
  ) {
    const storeId = await this.resolveStoreIdBySubdomain(subdomain);
    if (req.optionalStoreUserAuth) {
      return this.findOneForStore(storeId, linkId);
    }
    const link = await this.linksRepository.findOne({
      where: {
        id: linkId,
        storeId,
        isActive: true,
      },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    return toLinkDto(link);
  }

  async resolveByAccessLink(
    subdomain: string,
    accessLinkRaw: string,
    req: TenantAwareRequest,
  ) {
    const storeId = await this.resolveStoreIdBySubdomain(subdomain);
    const accessLink = this.normalizeAccessLink(accessLinkRaw);
    const link = await this.linksRepository.findOne({
      where: { storeId, accessLink },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    if (!this.canAccessResolvedLink(link, req)) {
      throw new NotFoundException('Link not found');
    }
    if (!req.optionalStoreUserAuth) {
      await this.analyticsService.recordEvent(link.id, storeId, 'view');
    }
    const refreshed = await this.linksRepository.findOneOrFail({
      where: { id: link.id },
    });
    return toLinkDto(refreshed);
  }

  async visitByAccessLink(
    subdomain: string,
    accessLinkRaw: string,
    req: TenantAwareRequest,
  ): Promise<{ externalLink: string }> {
    const storeId = await this.resolveStoreIdBySubdomain(subdomain);
    const accessLink = this.normalizeAccessLink(accessLinkRaw);
    const link = await this.linksRepository.findOne({
      where: { storeId, accessLink },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    if (!this.canAccessResolvedLink(link, req)) {
      throw new NotFoundException('Link not found');
    }
    if (!req.optionalStoreUserAuth) {
      await this.analyticsService.recordVisit(link.id, storeId);
    }
    return { externalLink: link.externalLink };
  }

  private canAccessResolvedLink(link: Link, req: TenantAwareRequest): boolean {
    if (req.optionalStoreUserAuth) {
      return true;
    }
    return link.isActive;
  }

  private normalizeAccessLink(raw: string): string {
    const s = raw.trim().toLowerCase();
    if (!s || s.length > 120) {
      throw new NotFoundException('Link not found');
    }
    return s;
  }

  findAllForStore(storeId: string) {
    return this.linksRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForStore(storeId: string, linkId: string) {
    const link = await this.linksRepository.findOne({
      where: { id: linkId, storeId },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    return link;
  }

  async createForStore(
    storeId: string,
    dto: CreateLinkDto,
    imageFile?: MultipartUploadFile,
  ) {
    let accessLink: string;
    if (dto.accessLink?.trim()) {
      await this.membershipsService.assertCanUseCustomLink(storeId);
      accessLink = this.normalizeAccessLinkInput(dto.accessLink);
    } else {
      accessLink = await this.generateUniqueAccessLink(storeId);
    }

    const exists = await this.linksRepository.exists({
      where: { storeId, accessLink },
    });
    if (exists) {
      throw new ConflictException(
        'accessLink is already in use for this store',
      );
    }

    const imageKey = imageFile
      ? await this.imageStorage.saveUploadedFile(imageFile)
      : null;

    const link = this.linksRepository.create({
      storeId,
      name: dto.name.trim(),
      externalLink: dto.externalLink.trim(),
      accessLink,
      image: imageKey,
      source: dto.source?.trim() ?? null,
      isPublic: dto.isPublic ?? true,
      isActive: dto.isActive ?? true,
      view: 0,
      click: 0,
    });

    return toLinkDto(await this.linksRepository.save(link));
  }

  async updateForStore(
    storeId: string,
    linkId: string,
    dto: UpdateLinkDto,
    imageFile?: MultipartUploadFile,
  ) {
    const link = await this.findOneForStore(storeId, linkId);

    if (dto.name !== undefined) link.name = dto.name.trim();
    if (dto.externalLink !== undefined)
      link.externalLink = dto.externalLink.trim();
    if (dto.source !== undefined) link.source = dto.source?.trim() ?? null;
    if (dto.isPublic !== undefined) link.isPublic = dto.isPublic;
    if (dto.isActive !== undefined) link.isActive = dto.isActive;
    if (imageFile) {
      link.image = await this.imageStorage.saveUploadedFile(imageFile);
    } else if (dto.removeImage) {
      link.image = null;
    }

    return toLinkDto(await this.linksRepository.save(link));
  }

  async removeForStore(storeId: string, linkId: string) {
    const link = await this.findOneForStore(storeId, linkId);
    await this.linksRepository.remove(link);
  }

  private async generateUniqueAccessLink(storeId: string): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const candidate = this.randomAccessLink(
        LinksService.ACCESS_LINK_LENGTH,
      );
      const taken = await this.linksRepository.exists({
        where: { storeId, accessLink: candidate },
      });
      if (!taken) {
        return candidate;
      }
    }
    throw new ConflictException('Could not generate a unique access link');
  }

  private async resolveStoreIdBySubdomain(subdomain: string) {
    const normalized = subdomain.trim().toLowerCase();
    const store = await this.storesRepository.findOne({
      where: { subdomain: normalized },
      select: { id: true },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store.id;
  }

  private normalizeAccessLinkInput(raw: string): string {
    const s = raw.trim().toLowerCase();
    if (
      !s ||
      s.length > 120 ||
      !LinksService.ACCESS_LINK_PATTERN.test(s)
    ) {
      throw new BadRequestException(
        'accessLink can only contain lowercase letters, numbers, and dashes',
      );
    }
    return s;
  }

  private randomAccessLink(length: number): string {
    let out = '';
    const alphabet = LinksService.ACCESS_LINK_ALPHABET;
    for (let i = 0; i < length; i++) {
      out += alphabet[randomInt(alphabet.length)];
    }
    return out;
  }
}
