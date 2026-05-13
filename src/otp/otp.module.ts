import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './otp.entity';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Otp, User, Store])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
