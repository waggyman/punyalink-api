import type { TenantAwareRequest } from '../../tenant/tenant-request.util';

export function parseBearerToken(authorization?: string): string | null {
  if (!authorization?.trim()) {
    return null;
  }
  const match = authorization.trim().match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

export function readAuthorizationHeader(
  req: TenantAwareRequest,
): string | undefined {
  const a = req.headers?.authorization;
  if (typeof a === 'string') {
    return a;
  }
  const b = req.raw?.headers?.authorization;
  if (typeof b === 'string') {
    return b;
  }
  return undefined;
}
