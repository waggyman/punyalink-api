import type { StoreJwtUser } from '../store-users/store-user.types';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by OptionalStoreUserJwtGuard when a valid store-user Bearer token was sent */
    optionalStoreUserAuth?: StoreJwtUser;
    /** Attached by Passport auth guards */
    user?: unknown;
    /** Subdomain from Host (e.g. acme from acme.punyalink.id), or dev header override */
    tenantSubdomain?: string | null;
    /** Resolved store after tenant + JWT alignment checks */
    tenantStore?: { id: string; subdomain: string };
  }
}

export {};
