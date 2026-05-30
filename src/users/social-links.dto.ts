import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { SOCIAL_PLATFORMS, type SocialPlatform } from './user-social-links';

function emptyToNull(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  return typeof value === 'string' ? value : String(value);
}

function decorateSocialLinkField(
  target: object,
  platform: SocialPlatform,
): void {
  IsOptional()(target, platform);
  Transform(({ value }) => emptyToNull(value))(target, platform);
  ValidateIf((_, value) => value != null)(target, platform);
  IsUrl(
    { require_protocol: true },
    { message: `${platform} must be a valid URL` },
  )(target, platform);
  MaxLength(2048)(target, platform);
}

/** Validated PATCH body for `socialLinks` on user profile. */
export class SocialLinksDto {
  [key: string]: string | null | undefined;
}

for (const platform of SOCIAL_PLATFORMS) {
  decorateSocialLinkField(SocialLinksDto.prototype, platform);
}
