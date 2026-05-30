import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SocialLinksDto } from './social-links.dto';

export class UserRegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'subdomain must be a string' })
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  @MinLength(3, { message: 'subdomain must be at least 3 characters' })
  @IsNotEmpty({ message: 'subdomain is required' })
  subdomain: string;
}

export class UsersLoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}
