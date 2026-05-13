import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { RequireTenantSubdomainGuard } from '../tenant/guards/require-tenant-subdomain.guard';
import {
  resolveTenantSubdomain,
  type TenantAwareRequest,
} from '../tenant/tenant-request.util';
import { UsersAuthService } from './users-auth.service';
import { UserRegisterDto, UsersLoginDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
@UsePipes(RequestValidationPipe)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersAuthService: UsersAuthService,
  ) {}

  @Post('register')
  register(@Body() body: UserRegisterDto) {
    return this.usersService.register(body);
  }

  @Post('login')
  @UseGuards(RequireTenantSubdomainGuard)
  login(@Req() req: FastifyRequest, @Body() body: UsersLoginDto) {
    const tenantSubdomain = resolveTenantSubdomain(req as TenantAwareRequest)!;
    return this.usersAuthService.login(
      body.email,
      body.password,
      tenantSubdomain,
    );
  }
}
