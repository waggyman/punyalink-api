import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  toStoreProfileDto,
  toUserProfileDto,
} from '../common/profile/profile-response.util';
import { TemporaryCollection } from '../link-collections/temporary-collection.entity';
import { Link } from '../links/links.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';
import {
  AdminStoreListQueryDto,
  resolveAdminPagination,
  toAdminPaginatedResponse,
} from './admin.dto';

@Injectable()
export class AdminStoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
    @InjectRepository(TemporaryCollection)
    private readonly collectionsRepository: Repository<TemporaryCollection>,
    private readonly membershipsService: MembershipsService,
  ) {}

  async listStores(query: AdminStoreListQueryDto) {
    const { page, limit, skip } = resolveAdminPagination(query);
    const qb = this.storesRepository
      .createQueryBuilder('store')
      .orderBy('store.created_at', 'DESC');

    const term = query.search?.trim();
    if (term) {
      qb.andWhere(
        `(store.subdomain ILIKE :term OR store.title ILIKE :term OR store.id IN (
          SELECT u.store_id FROM users u
          WHERE u.email ILIKE :term OR u.name ILIKE :term
        ))`,
        { term: `%${term}%` },
      );
    }

    const [stores, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = await Promise.all(
      stores.map(async (store) => {
        const membership =
          await this.membershipsService.getStoreMembershipStatus(store.id);
        const users =
          store.users?.length > 0
            ? store.users
            : await this.usersRepository.find({ where: { storeId: store.id } });

        return {
          store: {
            id: store.id,
            subdomain: store.subdomain,
            title: store.title,
            isVerified: store.isVerified,
            createdAt: store.createdAt.toISOString(),
            updatedAt: store.updatedAt.toISOString(),
          },
          users: users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
          })),
          membership,
        };
      }),
    );

    return toAdminPaginatedResponse(items, total, page, limit);
  }

  async getStoreDetail(storeId: string) {
    const store = await this.storesRepository.findOne({
      where: { id: storeId },
      relations: { users: true },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const [membership, linkCount, collectionCount, users] = await Promise.all([
      this.membershipsService.getStoreMembershipStatus(storeId),
      this.linksRepository.count({ where: { storeId } }),
      this.collectionsRepository.count({ where: { storeId } }),
      store.users?.length
        ? Promise.resolve(store.users)
        : this.usersRepository.find({ where: { storeId } }),
    ]);

    return {
      store: {
        ...toStoreProfileDto(store),
        isVerified: store.isVerified,
        createdAt: store.createdAt.toISOString(),
        updatedAt: store.updatedAt.toISOString(),
      },
      users: users.map(toUserProfileDto),
      membership,
      stats: {
        linkCount,
        collectionCount,
      },
    };
  }
}
