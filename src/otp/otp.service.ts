import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';
import {
  OtpConfirmDto,
  OtpEmailResendDto,
  OtpPasswordResetConfirmDto,
} from './otp.dto';
import { Otp } from './otp.entity';

export type OtpPurpose = 'register' | 'password_reset';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async createOtp(
    target: string,
    purpose: OtpPurpose = 'register',
    ttlMinutes = 10,
  ) {
    const normalized = target.trim().toLowerCase();
    const value = this.generateOtpValue();
    const expiredAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.otpRepository.delete({ target: normalized, purpose });

    return this.otpRepository.save(
      this.otpRepository.create({
        target: normalized,
        value,
        expiredAt,
        purpose,
      }),
    );
  }

  async confirmRegistration(payload: OtpConfirmDto) {
    const target = payload.target.trim().toLowerCase();
    const otp = await this.findValidOtp(target, 'register', payload.value);

    const user = await this.usersRepository.findOne({
      where: { email: target },
    });
    if (!user) {
      throw new BadRequestException('No user found for this OTP target');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    await this.usersRepository.update(user.id, {
      password: passwordHash,
      isVerified: true,
    });

    await this.storesRepository.update(user.storeId, {
      isVerified: true,
    });

    await this.otpRepository.delete({ id: otp.id });

    return {
      message: 'OTP confirmed successfully',
      target,
      user_verified: true,
      store_verified: true,
    };
  }

  async confirmPasswordReset(payload: OtpPasswordResetConfirmDto) {
    const target = payload.target.trim().toLowerCase();
    const otp = await this.findValidOtp(
      target,
      'password_reset',
      payload.value,
    );

    const user = await this.usersRepository.findOne({
      where: { email: target },
    });
    if (!user) {
      throw new BadRequestException('No user found for this email');
    }
    if (!user.isVerified) {
      throw new BadRequestException('Account is not verified');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    await this.usersRepository.update(user.id, { password: passwordHash });
    await this.otpRepository.delete({ id: otp.id });

    return {
      message: 'Password reset successfully',
      target,
    };
  }

  async resendEmailOtp(payload: OtpEmailResendDto) {
    const target = payload.target.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email: target },
    });
    if (!user) {
      throw new BadRequestException('No user found for this email');
    }

    const existingOtp = await this.otpRepository.findOne({
      where: { target, purpose: 'register' },
    });
    if (!existingOtp) {
      throw new BadRequestException(
        'OTP for this target does not exist. Please start the registration flow first.',
      );
    }

    const otp = await this.createOtp(target, 'register');
    return this.toClientResponse(otp);
  }

  async resendPasswordResetOtp(targetRaw: string) {
    const target = targetRaw.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email: target },
    });
    if (!user) {
      throw new BadRequestException('No user found for this email');
    }
    if (!user.isVerified) {
      throw new BadRequestException('Account is not verified');
    }

    const otp = await this.createOtp(target, 'password_reset');
    return this.toClientResponse(otp);
  }

  private async findValidOtp(
    target: string,
    purpose: OtpPurpose,
    submittedValue: string,
  ) {
    const otp = await this.otpRepository.findOne({ where: { target, purpose } });
    if (!otp) {
      throw new UnauthorizedException('OTP not found or already used');
    }
    if (otp.value !== submittedValue.trim()) {
      throw new UnauthorizedException('Invalid OTP value');
    }
    if (otp.expiredAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP has expired');
    }
    return otp;
  }

  toClientResponse(otp: Otp) {
    const base = {
      message:
        otp.purpose === 'password_reset'
          ? 'Password reset OTP created'
          : 'OTP created',
      target: otp.target,
      purpose: otp.purpose,
      otp_expired_at: otp.expiredAt,
    };
    if (this.shouldExposeOtpInResponse()) {
      return { ...base, otp: otp.value };
    }
    return base;
  }

  private shouldExposeOtpInResponse(): boolean {
    return process.env.OTP_EXPOSE_IN_RESPONSE === 'true';
  }

  private generateOtpValue(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
