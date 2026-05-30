import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics/analytics.service';
import { isValidStoredImageKey } from '../common/images/image-url.util';
import {
  toStoreProfileDto,
  toUserProfileDto,
} from '../common/profile/profile-response.util';
import { Link } from '../links/links.entity';
import { toLinkDtoList } from '../links/link-response.util';
import { TemporaryCollection } from '../link-collections/temporary-collection.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(TemporaryCollection)
    private readonly collectionsRepository: Repository<TemporaryCollection>,
    private readonly analyticsService: AnalyticsService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async getDashboard(storeId: string, userId: string, days = 30) {
    const [store, user, totalLinks, totalActiveLinks, collectionCount] =
      await Promise.all([
        this.storesRepository.findOneOrFail({ where: { id: storeId } }),
        this.usersRepository.findOneOrFail({ where: { id: userId } }),
        this.linksRepository.count({ where: { storeId } }),
        this.linksRepository.count({ where: { storeId, isActive: true } }),
        this.collectionsRepository.count({ where: { storeId } }),
      ]);

    const allowedCollections =
      await this.membershipsService.getMaxCollections(storeId);
    const membership =
      await this.membershipsService.getStoreMembershipStatus(storeId);
    const [viewsPerDay, clicksPerDay, topClickedLinks] = await Promise.all([
      this.analyticsService.viewsPerDay(storeId, days),
      this.analyticsService.clicksPerDay(storeId, days),
      this.analyticsService.topClickedLinks(storeId, 3),
    ]);

    const profileBanner = this.buildProfileBanner(user, store);

    return {
      stats: {
        totalLinks,
        totalActiveLinks,
        viewsPerDay,
        clicksPerDay,
        topClickedLinks: toLinkDtoList(topClickedLinks),
        collections: {
          total: collectionCount,
          allowed: allowedCollections,
        },
      },
      profileBanner,
      membership,
      user: toUserProfileDto(user),
      store: toStoreProfileDto(store),
    };
  }

  private buildProfileBanner(user: User, store: Store) {
    const items = {
      profileImage: isValidStoredImageKey(user.profileImageKey),
      storeTitle: !!store.title?.trim(),
      storeDescription: !!store.description?.trim(),
      storeBackground: isValidStoredImageKey(store.background),
    };
    const keys = Object.keys(items) as (keyof typeof items)[];
    const completed = keys.filter((k) => items[k]).length;
    const total = keys.length;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
      items,
      isComplete: completed === total,
    };
  }
}
