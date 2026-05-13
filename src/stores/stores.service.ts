import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './stores.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
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
}
