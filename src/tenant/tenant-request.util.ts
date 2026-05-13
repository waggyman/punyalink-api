import type { FastifyRequest } from 'fastify';

/** Nest Fastify adapter may expose wrapper vs raw request — treat both as tenant-aware. */
export type TenantAwareRequest = FastifyRequest & { raw?: FastifyRequest };

function configuredTenantHeaderName(): string {
  const custom = process.env.TENANT_SUBDOMAIN_HEADER?.trim();
  return custom && custom.length > 0
    ? custom.toLowerCase()
    : 'x-tenant-subdomain';
}

function headerString(
  req: TenantAwareRequest,
  headerName: string,
): string | undefined {
  const a = req.headers?.[headerName];
  if (typeof a === 'string') {
    return a;
  }
  const b = req.raw?.headers?.[headerName];
  if (typeof b === 'string') {
    return b;
  }
  return undefined;
}

/**
 * Resolves tenant subdomain from middleware-attached fields or request headers (both wrapper/raw).
 */
export function resolveTenantSubdomain(req: TenantAwareRequest): string | null {
  const fromProp =
    req.tenantSubdomain?.trim().toLowerCase() ||
    req.raw?.tenantSubdomain?.trim().toLowerCase();
  if (fromProp) {
    return fromProp;
  }

  const fromHeader = headerString(req, configuredTenantHeaderName())
    ?.trim()
    .toLowerCase();
  if (fromHeader) {
    return fromHeader;
  }

  return null;
}

/** Keeps tenant subdomain on wrapper + raw Fastify request (Nest/Fastify layering). */
export function syncTenantSubdomainOnRequest(
  req: TenantAwareRequest,
  subdomain: string | null,
): void {
  req.tenantSubdomain = subdomain;
  if (req.raw) {
    req.raw.tenantSubdomain = subdomain;
  }
}

/** Keeps resolved tenant store on wrapper + raw request. */
export function syncTenantStoreOnRequest(
  req: TenantAwareRequest,
  store: { id: string; subdomain: string } | undefined,
): void {
  req.tenantStore = store;
  if (req.raw) {
    req.raw.tenantStore = store;
  }
}

/** Reads tenant store attached by TenantMatchesUserJwtGuard (wrapper or raw). */
export function resolveTenantStore(
  req: TenantAwareRequest,
): { id: string; subdomain: string } | undefined {
  return req.tenantStore ?? req.raw?.tenantStore;
}
