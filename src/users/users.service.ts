import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { OtpService } from '../otp/otp.service';
import { Store } from '../stores/stores.entity';
import { ForgotPasswordDto, UserRegisterDto } from './users.dto';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    private readonly otpService: OtpService,
  ) {}

  async register(payload: UserRegisterDto) {
    const email = payload.email.trim().toLowerCase();
    const name = payload.name.trim();
    const subdomain = payload.subdomain.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const existingStore = await this.storesRepository.findOne({
      where: { subdomain },
    });
    if (existingStore) {
      throw new ConflictException('Subdomain is already taken');
    }

    const store = await this.storesRepository.save(
      this.storesRepository.create({
        subdomain,
        title: name,
        isVerified: false,
      }),
    );

    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        name,
        password: randomUUID(),
        storeId: store.id,
        isVerified: false,
      }),
    );

    const otp = await this.otpService.createOtp(email, 'register');

    return {
      email,
      subdomain,
      ...this.otpService.toClientResponse(otp),
      message: 'Registration started. Please verify OTP.',
    };
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });
    const generic = {
      message:
        'If this email is registered, use the OTP to reset your password',
      email,
    };
    if (!user?.isVerified) {
      return generic;
    }

    const otp = await this.otpService.createOtp(email, 'password_reset');
    return { ...generic, ...this.otpService.toClientResponse(otp) };
  }
}
