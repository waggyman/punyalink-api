import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateStoreProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;
}
