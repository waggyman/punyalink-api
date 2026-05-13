import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';

export class CreateLinkCollectionDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'accessLink can only contain lowercase letters, numbers, and dashes',
  })
  @MinLength(3)
  @MaxLength(120)
  accessLink?: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'linkIds must contain at least 2 links' })
  @ArrayUnique()
  @IsUUID('4', { each: true })
  linkIds: string[];
}

export class UpdateLinkCollectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

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
  @IsArray()
  @IsUUID('4', { each: true })
  addLinkIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeLinkIds?: string[];
}
