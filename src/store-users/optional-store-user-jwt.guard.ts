import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  parseBearerToken,
  readAuthorizationHeader,
} from '../common/auth/parse-bearer-token';
import { Store } from '../stores/stores.entity';
import {
  resolveTenantSubdomain,
  type TenantAwareRequest,
} from '../tenant/tenant-request.util';
import type { StoreJwtUser, StoreUserJwtPayload } from './store-user.types';

function syncOptionalStoreUserAuth(
  req: TenantAwareRequest,
  auth: StoreJwtUser | undefined,
): void {
  req.optionalStoreUserAuth = auth;
  if (req.raw) {
    req.raw.optionalStoreUserAuth = auth;
  }
}

/**
 * If no Bearer token: continues as anonymous (optionalStoreUserAuth unset).
 * If Bearer token present: verifies store-user access JWT and ensures it matches tenant subdomain.
 * Invalid token → 401.
 */
@Injectable()
export class OptionalStoreUserJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<TenantAwareRequest>();
    const token = parseBearerToken(readAuthorizationHeader(req));

    if (!token) {
      syncOptionalStoreUserAuth(req, undefined);
      return true;
    }

    let payload: StoreUserJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<StoreUserJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_USER_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== 'user' || payload.type !== 'access') {
      throw new UnauthorizedException();
    }

    const subdomain = resolveTenantSubdomain(req);
    if (!subdomain) {
      throw new UnauthorizedException();
    }

    const store = await this.storesRepository.findOne({
      where: { subdomain: subdomain.trim().toLowerCase() },
      select: { id: true },
    });

    if (!store || store.id !== payload.storeId) {
      throw new UnauthorizedException('Token does not match this store');
    }

    syncOptionalStoreUserAuth(req, {
      userId: payload.sub,
      email: payload.email,
      storeId: payload.storeId,
    });
    return true;
  }
}
