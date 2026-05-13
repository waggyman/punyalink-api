import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLinkDto {
  @IsOptional()
  @IsString({ message: 'image must be a string' })
  @MaxLength(512)
  image?: string | null;

  @IsString({ message: 'name must be a string' })
  @MinLength(1)
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(255)
  name: string;

  @IsString({ message: 'externalLink must be a string' })
  @IsUrl(
    { require_protocol: true },
    { message: 'externalLink must be a valid URL' },
  )
  @MaxLength(2048)
  externalLink: string;

  /** URL slug for this store (unique per store). Omit to auto-generate. */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'accessLink can only contain lowercase letters, numbers, and dashes',
  })
  @MinLength(3)
  @MaxLength(120)
  accessLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  image?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  externalLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
