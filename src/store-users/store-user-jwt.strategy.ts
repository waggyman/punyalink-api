import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import {
  parseBearerToken,
  readAuthorizationHeader,
} from '../common/auth/parse-bearer-token';
import type { TenantAwareRequest } from '../tenant/tenant-request.util';
import { User } from '../users/users.entity';
import type { StoreJwtUser, StoreUserJwtPayload } from './store-user.types';

@Injectable()
export class StoreUserJwtStrategy extends PassportStrategy(
  Strategy,
  'store-user-jwt',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: (req: TenantAwareRequest): string | null =>
        parseBearerToken(readAuthorizationHeader(req)),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_USER_SECRET'),
    });
  }

  async validate(payload: unknown): Promise<StoreJwtUser> {
    const p = payload as StoreUserJwtPayload;
    if (p.role !== 'user' || p.type !== 'access') {
      throw new UnauthorizedException();
    }

    const user = await this.usersRepository.findOne({
      where: { id: p.sub },
    });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      email: user.email,
      storeId: user.storeId,
    };
  }
}
