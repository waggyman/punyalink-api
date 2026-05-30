/**
 * Supported social / profile link platforms (link-in-bio style).
 * Add new platforms here — API responses always include every key (null when unset).
 */
export const SOCIAL_PLATFORMS = [
  'instagram',
  'tiktok',
  'facebook',
  'x',
  'youtube',
  'linkedin',
  'pinterest',
  'snapchat',
  'threads',
  'whatsapp',
  'telegram',
  'discord',
  'twitch',
  'spotify',
  'github',
  'behance',
  'dribbble',
  'website',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLinks = Partial<Record<SocialPlatform, string | null>>;

export type SocialLinksResponse = Record<SocialPlatform, string | null>;

export function emptySocialLinks(): SocialLinksResponse {
  return SOCIAL_PLATFORMS.reduce(
    (acc, platform) => {
      acc[platform] = null;
      return acc;
    },
    {} as SocialLinksResponse,
  );
}

export function toSocialLinksResponse(
  links: SocialLinks | null | undefined,
): SocialLinksResponse {
  const raw = links ?? {};
  const out = emptySocialLinks();
  for (const platform of SOCIAL_PLATFORMS) {
    const value = raw[platform];
    out[platform] =
      typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  return out;
}

export function mergeSocialLinks(
  current: SocialLinks | null | undefined,
  patch: SocialLinks,
): SocialLinks {
  const next = { ...(current ?? {}) };
  for (const platform of SOCIAL_PLATFORMS) {
    if (patch[platform] === undefined) {
      continue;
    }
    const value = patch[platform];
    if (value === null || value === '') {
      delete next[platform];
    } else {
      next[platform] = value.trim();
    }
  }
  return next;
}

export function hasAnySocialLink(links: SocialLinks | null | undefined): boolean {
  return SOCIAL_PLATFORMS.some((p) => {
    const v = links?.[p];
    return typeof v === 'string' && v.trim().length > 0;
  });
}
