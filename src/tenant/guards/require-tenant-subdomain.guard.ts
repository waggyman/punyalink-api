import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import {
  resolveTenantSubdomain,
  syncTenantSubdomainOnRequest,
  type TenantAwareRequest,
} from '../tenant-request.util';

/** Ensures request includes tenant subdomain header. */
@Injectable()
export class RequireTenantSubdomainGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<TenantAwareRequest>();
    const sub = resolveTenantSubdomain(req);
    if (!sub) {
      throw new BadRequestException('x-tenant-subdomain header is required');
    }
    syncTenantSubdomainOnRequest(req, sub);
    return true;
  }
}
