import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { StoreUserJwtPayload } from '../store-users/store-user.types';
import { User } from './users.entity';

@Injectable()
export class UsersAuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(emailRaw: string, password: string, hostTenantSubdomain: string) {
    const tenantSubdomain = hostTenantSubdomain.trim().toLowerCase();
    const email = emailRaw.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: { store: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in',
      );
    }

    if (!user.store || user.store.subdomain !== tenantSubdomain) {
      throw new BadRequestException(
        'This account does not belong to this store dashboard',
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expiresIn = (this.configService.get<string>('JWT_USER_EXPIRES_IN') ??
      '24h') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const payload: StoreUserJwtPayload = {
      sub: user.id,
      email: user.email,
      role: 'user',
      storeId: user.storeId,
      type: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    });

    const expiredAt = this.getExpiryDate(expiresIn);

    return {
      accessToken,
      expired_at: expiredAt,
      tokenType: 'Bearer',
      store: {
        id: user.store.id,
        subdomain: user.store.subdomain,
      },
    };
  }

  private getExpiryDate(expiresIn: string) {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(now + 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const unitMs =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

    return new Date(now + value * unitMs);
  }
}
