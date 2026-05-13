import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './admins.entity';

@Injectable()
export class AdminsService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    @InjectRepository(Admin)
    private readonly adminsRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async login(email: string, password: string) {
    const admin = await this.adminsRepository.findOne({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(admin);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const admin = await this.adminsRepository.findOne({
      where: { id: payload.sub },
    });
    if (!admin || !admin.refreshToken || !admin.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (admin.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isValid = await bcrypt.compare(refreshToken, admin.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(admin);
  }

  private async issueTokens(admin: Admin) {
    const accessTokenPayload = {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
      type: 'access',
    };
    const refreshTokenPayload = {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
      type: 'refresh',
    };
    const accessExpiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) ?? '30d') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      secret: this.getAccessSecret(),
      expiresIn: accessExpiresIn,
    });
    const accessTokenExpiresAt = this.getExpiryDate(accessExpiresIn);

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: refreshExpiresIn,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = this.getExpiryDate(refreshExpiresIn);

    await this.adminsRepository.update(admin.id, {
      refreshToken: refreshTokenHash,
      refreshTokenExpiresAt,
    });

    return {
      accessToken,
      expired_at: accessTokenExpiresAt,
      refreshToken,
      refresh_token_expired_at: refreshTokenExpiresAt,
      tokenType: 'Bearer',
    };
  }

  private getAccessSecret() {
    return this.accessSecret;
  }

  private getRefreshSecret() {
    return this.refreshSecret;
  }

  private getExpiryDate(expiresIn: string) {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(now + 30 * 24 * 60 * 60 * 1000);
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
