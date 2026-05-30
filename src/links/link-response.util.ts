import { buildPublicImageUrl } from '../common/images/image-url.util';
import type { Link } from './links.entity';

export type LinkDto = {
  id: string;
  imageUrl: string | null;
  name: string;
  externalLink: string;
  accessLink: string;
  view: number;
  click: number;
  source: string | null;
  isPublic: boolean;
  isActive: boolean;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Resolve public image URL from stored opaque key (legacy http URLs still work). */
export function resolveLinkImageUrl(stored: string | null | undefined): string | null {
  if (!stored?.trim()) {
    return null;
  }
  const fromKey = buildPublicImageUrl(stored);
  if (fromKey) {
    return fromKey;
  }
  const trimmed = stored.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function toLinkDto(link: Link): LinkDto {
  return {
    id: link.id,
    imageUrl: resolveLinkImageUrl(link.image),
    name: link.name,
    externalLink: link.externalLink,
    accessLink: link.accessLink,
    view: link.view,
    click: link.click,
    source: link.source,
    isPublic: link.isPublic,
    isActive: link.isActive,
    storeId: link.storeId,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export function toLinkDtoList(links: Link[]): LinkDto[] {
  return links.map(toLinkDto);
}

export type PaginatedLinksResponse = {
  items: LinkDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function toPaginatedLinksResponse(
  links: Link[],
  total: number,
  page: number,
  limit: number,
): PaginatedLinksResponse {
  return {
    items: toLinkDtoList(links),
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
