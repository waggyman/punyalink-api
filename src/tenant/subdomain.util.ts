/** Normalize env-style comma list into a Set of lowercase labels */
export function parseReservedSubdomains(csv?: string): Set<string> {
  const defaults = ['www', 'api', 'admin', 'app', 'mail', 'cdn'];
  const extra =
    csv
      ?.split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return new Set([...defaults, ...extra]);
}

export type ExtractTenantSubdomainOptions = {
  baseDomain: string;
  reserved: Set<string>;
  /** Dev-only: header takes precedence when non-empty */
  headerSubdomain?: string | null;
};

/**
 * Extract tenant subdomain from Host.
 * Example: acme.punyalink.id + base punyalink.id → acme
 */
export function extractTenantSubdomain(
  hostHeader: string | undefined,
  opts: ExtractTenantSubdomainOptions,
): string | null {
  const trimmedHeader = opts.headerSubdomain?.trim().toLowerCase();
  if (trimmedHeader) {
    return trimmedHeader;
  }

  if (!hostHeader?.trim()) {
    return null;
  }

  const hostname = hostHeader.split(':')[0]?.trim().toLowerCase();
  if (!hostname) {
    return null;
  }

  const base = opts.baseDomain.trim().toLowerCase();
  if (!base) {
    return null;
  }

  if (hostname === base || hostname === `www.${base}`) {
    return null;
  }

  if (!hostname.endsWith(`.${base}`)) {
    return null;
  }

  const prefix = hostname.slice(0, -`.${base}`.length);
  if (!prefix || prefix.includes('.')) {
    return null;
  }

  if (opts.reserved.has(prefix)) {
    return null;
  }

  return prefix;
}
