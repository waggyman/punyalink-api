import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DEFAULT_LINKS_PAGE = 1;
export const DEFAULT_LINKS_LIMIT = 25;
export const MAX_LINKS_LIMIT = 100;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LINKS_LIMIT)
  limit?: number;
}

export function resolveLinksPagination(query: ListLinksQueryDto): {
  page: number;
  limit: number;
  skip: number;
} {
  const page =
    query.page !== undefined && query.page >= 1
      ? query.page
      : DEFAULT_LINKS_PAGE;
  const limit =
    query.limit !== undefined && query.limit >= 1
      ? Math.min(query.limit, MAX_LINKS_LIMIT)
      : DEFAULT_LINKS_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}
