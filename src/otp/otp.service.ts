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
import { OtpConfirmDto, OtpEmailResendDto } from './otp.dto';
import { Otp } from './otp.entity';

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

  async createOtp(target: string, ttlMinutes = 10) {
    const value = this.generateOtpValue();
    const expiredAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Keep only the latest OTP for each target.
    await this.otpRepository.delete({ target });

    const otp = this.otpRepository.create({
      target,
      value,
      expiredAt,
    });

    return this.otpRepository.save(otp);
  }

  async confirm(payload: OtpConfirmDto) {
    const target = payload.target.trim().toLowerCase();
    const value = payload.value.trim();
    const password = payload.password;

    const otp = await this.otpRepository.findOne({ where: { target } });
    if (!otp) {
      throw new UnauthorizedException('OTP not found or already used');
    }

    if (otp.value !== value) {
      throw new UnauthorizedException('Invalid OTP value');
    }

    if (otp.expiredAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP has expired');
    }

    const user = await this.usersRepository.findOne({
      where: { email: target },
    });
    if (!user) {
      throw new BadRequestException('No user found for this OTP target');
    }

    const passwordHash = await bcrypt.hash(password, 10);
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

  async resendEmailOtp(payload: OtpEmailResendDto) {
    const target = payload.target.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email: target },
    });
    if (!user) {
      throw new BadRequestException('No user found for this email');
    }

    const existingOtp = await this.otpRepository.findOne({ where: { target } });
    if (!existingOtp) {
      throw new BadRequestException(
        'OTP for this target does not exist. Please start the registration flow first.',
      );
    }

    const otp = await this.createOtp(target);

    return {
      message: 'OTP resent successfully',
      target,
      otp_expired_at: otp.expiredAt,
    };
  }

  private generateOtpValue(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
