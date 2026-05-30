import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsController } from './admins.controller';
import { AdminJwtAuthGuard } from './admin-jwt.guard';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { Admin } from './admins.entity';
import { AdminsService } from './admins.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Admin]),
    PassportModule.register({}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AdminsController],
  providers: [AdminsService, AdminJwtStrategy, AdminJwtAuthGuard],
  exports: [AdminsService, AdminJwtAuthGuard],
})
export class AdminsModule {}
