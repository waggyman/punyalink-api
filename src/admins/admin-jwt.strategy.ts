import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import {
  parseBearerToken,
  readAuthorizationHeader,
} from '../common/auth/parse-bearer-token';
import type { TenantAwareRequest } from '../tenant/tenant-request.util';

export type AdminJwtUser = {
  adminId: string;
  email: string;
};

type AdminJwtPayload = {
  sub: string;
  email: string;
  role: string;
  type: string;
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: TenantAwareRequest): string | null =>
        parseBearerToken(readAuthorizationHeader(req)),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: unknown): AdminJwtUser {
    const p = payload as AdminJwtPayload;
    if (p.role !== 'admin' || p.type !== 'access') {
      throw new UnauthorizedException();
    }
    return { adminId: p.sub, email: p.email };
  }
}
