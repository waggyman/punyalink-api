import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { StoreJwtUser } from '../store-users/store-user.types';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { StoreUserJwtAuthGuard } from '../store-users/store-user-jwt.guard';
import { RequireTenantSubdomainGuard } from '../tenant/guards/require-tenant-subdomain.guard';
import { TenantMatchesUserJwtGuard } from '../tenant/guards/tenant-matches-user-jwt.guard';
import { UpdateUserProfileDto } from './users.dto';
import { UsersProfileService } from './users-profile.service';

type MultipartRequest = FastifyRequest & {
  file: () => Promise<{
    mimetype: string;
    file: NodeJS.ReadableStream;
  } | undefined>;
};

@Controller('users/me')
@UseGuards(
  RequireTenantSubdomainGuard,
  StoreUserJwtAuthGuard,
  TenantMatchesUserJwtGuard,
)
@UsePipes(RequestValidationPipe)
export class UsersProfileController {
  constructor(private readonly usersProfileService: UsersProfileService) {}

  @Get()
  getMe(@Req() req: FastifyRequest) {
    const user = req.user as StoreJwtUser;
    return this.usersProfileService.getProfile(user.userId);
  }

  @Patch()
  updateMe(@Req() req: FastifyRequest, @Body() body: UpdateUserProfileDto) {
    const user = req.user as StoreJwtUser;
    return this.usersProfileService.updateProfile(user.userId, body);
  }

  @Post('profile-image')
  async uploadProfileImage(@Req() req: FastifyRequest) {
    const user = req.user as StoreJwtUser;
    const part = await (req as MultipartRequest).file();
    if (!part) {
      throw new BadRequestException('Image file is required');
    }
    return this.usersProfileService.setProfileImage(user.userId, part);
  }
}
