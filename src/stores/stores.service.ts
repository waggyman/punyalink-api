import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageStorageService } from '../common/images/image-storage.service';
import {
  toPublicStoreProfileDto,
  toStoreProfileDto,
  type PublicStoreProfileDto,
} from '../common/profile/profile-response.util';
import { UpdateStoreProfileDto } from './stores.dto';
import { Store } from './stores.entity';
import { User } from '../users/users.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly imageStorage: ImageStorageService,
  ) {}

  async checkSubdomainAvailability(subdomain: string) {
    const normalizedSubdomain = subdomain.trim().toLowerCase();
    const exists = await this.storesRepository.exists({
      where: { subdomain: normalizedSubdomain },
    });

    return {
      subdomain: normalizedSubdomain,
      available: !exists,
    };
  }

  async getPublicProfileBySubdomain(
    subdomain: string,
  ): Promise<PublicStoreProfileDto> {
    const store = await this.storesRepository.findOne({
      where: { subdomain: subdomain.trim().toLowerCase() },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const owner = await this.usersRepository.findOne({
      where: { storeId: store.id },
      order: { createdAt: 'ASC' },
    });
    if (!owner) {
      throw new NotFoundException('Store not found');
    }

    return toPublicStoreProfileDto(store, owner);
  }

  async getStoreForOwner(storeId: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async updateProfile(storeId: string, dto: UpdateStoreProfileDto) {
    const store = await this.getStoreForOwner(storeId);
    if (dto.title !== undefined) {
      store.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      store.description =
        dto.description === null || dto.description === undefined
          ? undefined
          : dto.description.trim() || undefined;
    }
    await this.storesRepository.save(store);
    return toStoreProfileDto(store);
  }

  async setBackgroundImage(
    storeId: string,
    file: { mimetype: string; file: NodeJS.ReadableStream },
  ) {
    const store = await this.getStoreForOwner(storeId);
    store.background = await this.imageStorage.saveUploadedFile(file);
    await this.storesRepository.save(store);
    return toStoreProfileDto(store);
  }
}
