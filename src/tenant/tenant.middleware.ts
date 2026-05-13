import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { syncTenantSubdomainOnRequest } from './tenant-request.util';

/**
 * Reads tenant from request header and attaches `tenantSubdomain`.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(
    req: FastifyRequest & { raw?: FastifyRequest },
    _res: unknown,
    next: () => void,
  ) {
    const headerName =
      this.configService.get<string>('TENANT_SUBDOMAIN_HEADER') ??
      'x-tenant-subdomain';

    const headerValue =
      typeof req.headers[headerName] === 'string'
        ? req.headers[headerName]
        : '';

    const tenantSubdomain = headerValue.trim().toLowerCase() || null;
    syncTenantSubdomainOnRequest(req, tenantSubdomain);
    next();
  }
}
