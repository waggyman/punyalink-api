import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { MembershipPurchaseStatus } from '../memberships/membership-purchase.entity';

export const DEFAULT_ADMIN_PAGE = 1;
export const DEFAULT_ADMIN_LIMIT = 25;
export const MAX_ADMIN_LIMIT = 100;

const PURCHASE_STATUSES: MembershipPurchaseStatus[] = [
  'pending',
  'receipt_submitted',
  'approved',
  'rejected',
];

export class AdminStoreListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ADMIN_LIMIT)
  limit?: number;
}

export class AdminPurchaseListQueryDto {
  @IsOptional()
  @IsIn(PURCHASE_STATUSES)
  status?: MembershipPurchaseStatus;

  /** Match invoice amount (exact) or store subdomain/title/email */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ADMIN_LIMIT)
  limit?: number;
}

export function resolveAdminPagination(query: {
  page?: number;
  limit?: number;
}): { page: number; limit: number; skip: number } {
  const page =
    query.page !== undefined && query.page >= 1
      ? query.page
      : DEFAULT_ADMIN_PAGE;
  const limit =
    query.limit !== undefined && query.limit >= 1
      ? Math.min(query.limit, MAX_ADMIN_LIMIT)
      : DEFAULT_ADMIN_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}

export function toAdminPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
