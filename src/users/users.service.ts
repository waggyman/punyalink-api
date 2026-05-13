import { Injectable } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { OtpService } from '../otp/otp.service';
import { Store } from '../stores/stores.entity';
import { UserRegisterDto } from './users.dto';
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
        password: randomUUID(), // placeholder until password setup is added.
        storeId: store.id,
        isVerified: false,
      }),
    );

    const otp = await this.otpService.createOtp(email);

    return {
      message: 'Registration started. Please verify OTP.',
      email,
      subdomain,
      otp_expired_at: otp.expiredAt,
    };
  }
}
