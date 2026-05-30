import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageStorageService } from '../common/images/image-storage.service';
import { toUserProfileDto } from '../common/profile/profile-response.util';
import { UpdateUserProfileDto } from './users.dto';
import { User } from './users.entity';
import { mergeSocialLinks } from './user-social-links';

@Injectable()
export class UsersProfileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly imageStorage: ImageStorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.findUser(userId);
    return toUserProfileDto(user);
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.findUser(userId);
    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }
    if (dto.socialLinks !== undefined) {
      user.socialLinks = mergeSocialLinks(user.socialLinks, dto.socialLinks);
    }
    await this.usersRepository.save(user);
    return toUserProfileDto(user);
  }

  async setProfileImage(
    userId: string,
    file: { mimetype: string; file: NodeJS.ReadableStream },
  ) {
    const user = await this.findUser(userId);
    user.profileImageKey = await this.imageStorage.saveUploadedFile(file);
    await this.usersRepository.save(user);
    return toUserProfileDto(user);
  }

  private async findUser(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
