import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import type { TenantAwareRequest } from '../tenant/tenant-request.util';
import { Link } from '../links/links.entity';
import { Store } from '../stores/stores.entity';
import { LinkCollectionMembership } from './link-collection-membership.entity';
import { CreateLinkCollectionDto, UpdateLinkCollectionDto } from './link-collections.dto';
import { TemporaryCollection } from './temporary-collection.entity';

const COLLECTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class LinkCollectionsService {
  private static readonly ACCESS_LINK_PATTERN = /^[a-z0-9-]+$/;
  private static readonly ACCESS_LINK_LENGTH = 12;
  private static readonly ACCESS_LINK_ALPHABET =
    'abcdefghijklmnopqrstuvwxyz0123456789-';

  constructor(
    @InjectRepository(TemporaryCollection)
    private readonly collectionsRepository: Repository<TemporaryCollection>,
    @InjectRepository(LinkCollectionMembership)
    private readonly membershipRepository: Repository<LinkCollectionMembership>,
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async create(storeId: string, dto: CreateLinkCollectionDto) {
    const accessLink =
      dto.accessLink && dto.accessLink.trim().length > 0
        ? this.normalizeAccessLinkInput(dto.accessLink)
        : this.randomAccessLink(LinkCollectionsService.ACCESS_LINK_LENGTH);

    const expiredAt = new Date(Date.now() + COLLECTION_TTL_MS);

    const exists = await this.collectionsRepository.exists({
      where: { storeId, accessLink },
    });
    if (exists) {
      throw new ConflictException(
        'accessLink is already in use for this collection',
      );
    }

    const entity = this.collectionsRepository.create({
      name: dto.name.trim(),
      accessLink,
      storeId,
      expiredAt,
    });
    const saved = await this.collectionsRepository.save(entity);

    await this.assertLinksBelongToStore(storeId, dto.linkIds, {
      requireActive: true,
    });
    await this.addMemberships(saved.id, dto.linkIds);

    return this.findOneAuthorized(storeId, saved.id);
  }

  async listAuthorized(storeId: string) {
    const collections = await this.collectionsRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      collections.map(async (c) => {
        const linkCount = await this.membershipRepository.count({
          where: { collectionId: c.id },
        });
        return {
          id: c.id,
          name: c.name,
          accessLink: c.accessLink,
          storeId: c.storeId,
          expiredAt: c.expiredAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          linkCount,
        };
      }),
    );
  }

  async findOneAuthorized(storeId: string, collectionId: string) {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, storeId },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    const { links } = await this.attachLinksForCollection(storeId, collection);
    return {
      id: collection.id,
      name: collection.name,
      accessLink: collection.accessLink,
      storeId: collection.storeId,
      expiredAt: collection.expiredAt,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      links,
    };
  }

  /**
   * Shared collection URL: anonymous sees active links only; store JWT same tenant sees all links in bundle.
   */
  async findByAccessLinkPublic(
    subdomain: string,
    accessLinkRaw: string,
    req: TenantAwareRequest,
  ) {
    const storeId = await this.resolveStoreIdBySubdomain(subdomain);
    const accessLink = this.normalizeAccessLinkParam(accessLinkRaw);

    const collection = await this.collectionsRepository.findOne({
      where: { storeId, accessLink },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.expiredAt.getTime() <= Date.now()) {
      throw new NotFoundException('Collection not found');
    }

    const { links } = await this.attachLinksForCollection(storeId, collection);

    const filtered = req.optionalStoreUserAuth
      ? links
      : links.filter((l) => l.isActive);

    return {
      id: collection.id,
      name: collection.name,
      accessLink: collection.accessLink,
      expiredAt: collection.expiredAt,
      links: filtered,
    };
  }

  async update(storeId: string, collectionId: string, dto: UpdateLinkCollectionDto) {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, storeId },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (dto.name !== undefined) {
      collection.name = dto.name.trim();
    }

    if (dto.accessLink !== undefined) {
      const next = this.normalizeAccessLinkInput(dto.accessLink);
      if (next !== collection.accessLink) {
        const taken = await this.collectionsRepository.exists({
          where: { storeId, accessLink: next },
        });
        if (taken) {
          throw new ConflictException(
            'accessLink is already in use for this collection',
          );
        }
        collection.accessLink = next;
      }
    }

    await this.collectionsRepository.save(collection);

    if (dto.removeLinkIds?.length) {
      await this.membershipRepository.delete({
        collectionId: collection.id,
        linkId: In(dto.removeLinkIds),
      });
    }

    if (dto.addLinkIds?.length) {
      await this.assertLinksBelongToStore(storeId, dto.addLinkIds, {
        requireActive: true,
      });
      await this.addMemberships(collection.id, dto.addLinkIds);
    }

    return this.findOneAuthorized(storeId, collection.id);
  }

  async remove(storeId: string, collectionId: string): Promise<void> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, storeId },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    await this.collectionsRepository.remove(collection);
  }

  private async attachLinksForCollection(
    storeId: string,
    collection: TemporaryCollection,
  ): Promise<{ collection: TemporaryCollection; links: Link[] }> {
    const memberships = await this.membershipRepository.find({
      where: { collectionId: collection.id },
      relations: { link: true },
      order: { linkId: 'ASC' },
    });

    const links = memberships
      .map((m) => m.link)
      .filter((link): link is Link => !!link && link.storeId === storeId);

    return { collection, links };
  }

  private async addMemberships(collectionId: string, linkIds: string[]) {
    const unique = [...new Set(linkIds)];
    for (const linkId of unique) {
      const exists = await this.membershipRepository.exists({
        where: { collectionId, linkId },
      });
      if (!exists) {
        await this.membershipRepository.save(
          this.membershipRepository.create({ collectionId, linkId }),
        );
      }
    }
  }

  private async assertLinksBelongToStore(
    storeId: string,
    linkIds: string[],
    opts?: { requireActive?: boolean },
  ) {
    const unique = [...new Set(linkIds)];
    const where: FindOptionsWhere<Link> = {
      storeId,
      id: In(unique),
    };
    if (opts?.requireActive) {
      where.isActive = true;
    }
    const count = await this.linksRepository.count({ where });
    if (count !== unique.length) {
      throw new BadRequestException(
        opts?.requireActive
          ? 'One or more links are inactive, do not belong to this store, or were not found'
          : 'One or more links do not belong to this store',
      );
    }
  }

  private normalizeAccessLinkInput(raw: string): string {
    const s = raw.trim().toLowerCase();
    if (
      !s ||
      s.length > 120 ||
      !LinkCollectionsService.ACCESS_LINK_PATTERN.test(s)
    ) {
      throw new BadRequestException(
        'accessLink can only contain lowercase letters, numbers, and dashes',
      );
    }
    return s;
  }

  private normalizeAccessLinkParam(raw: string): string {
    const s = raw.trim().toLowerCase();
    if (!s || s.length > 120) {
      throw new NotFoundException('Collection not found');
    }
    return s;
  }

  private randomAccessLink(length: number): string {
    let out = '';
    const alphabet = LinkCollectionsService.ACCESS_LINK_ALPHABET;
    for (let i = 0; i < length; i++) {
      out += alphabet[randomInt(alphabet.length)];
    }
    return out;
  }

  private async resolveStoreIdBySubdomain(subdomain: string): Promise<string> {
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
}
