/** Opaque stored file keys only — never accept arbitrary URLs from clients. */
const STORED_KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}\.(png|jpg|jpeg|webp)$/i;

export function isValidStoredImageKey(key: string | null | undefined): boolean {
  if (!key?.trim()) {
    return false;
  }
  return STORED_KEY_PATTERN.test(key.trim());
}

export function buildPublicImageUrl(
  key: string | null | undefined,
  baseUrl?: string,
): string | null {
  if (!isValidStoredImageKey(key)) {
    return null;
  }
  const root = (baseUrl ?? defaultApiBaseUrl()).replace(/\/$/, '');
  return `${root}/images/${key!.trim()}`;
}

function defaultApiBaseUrl(): string {
  const port = process.env.PORT ?? '3000';
  const host = process.env.PUBLIC_API_HOST ?? 'localhost';
  const protocol = process.env.PUBLIC_API_PROTOCOL ?? 'http';
  return `${protocol}://${host}:${port}`;
}
