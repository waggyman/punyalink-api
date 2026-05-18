import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

function parseOptionalBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

export class ListLinksQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBool(value))
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBool(value))
  @IsBoolean()
  isActive?: boolean;

  /** Authorized requests only; ignored for anonymous public list */
  @IsOptional()
  @IsIn(['click', 'view', 'createdAt'])
  sortBy?: 'click' | 'view' | 'createdAt';

  /** Authorized requests only */
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
