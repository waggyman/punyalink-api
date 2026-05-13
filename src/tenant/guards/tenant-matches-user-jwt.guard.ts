import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StoreJwtUser } from '../../store-users/store-user.types';
import { Store } from '../../stores/stores.entity';
import {
  resolveTenantSubdomain,
  syncTenantStoreOnRequest,
  syncTenantSubdomainOnRequest,
  type TenantAwareRequest,
} from '../tenant-request.util';

/**
 * After JWT auth: ensures x-tenant-subdomain maps to the same store as token storeId.
 */
@Injectable()
export class TenantMatchesUserJwtGuard implements CanActivate {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<TenantAwareRequest>();
    const subdomain = resolveTenantSubdomain(req);
    const user = req.user as StoreJwtUser | undefined;

    if (!subdomain) {
      throw new BadRequestException('x-tenant-subdomain header is required');
    }

    syncTenantSubdomainOnRequest(req, subdomain);

    if (!user?.storeId) {
      throw new UnauthorizedException();
    }

    const store = await this.storesRepository.findOne({
      where: { subdomain },
    });

    if (!store) {
      throw new BadRequestException('Unknown store subdomain');
    }

    if (store.id !== user.storeId) {
      throw new BadRequestException(
        'This account does not belong to this store dashboard',
      );
    }

    syncTenantStoreOnRequest(req, { id: store.id, subdomain: store.subdomain });
    return true;
  }
}
