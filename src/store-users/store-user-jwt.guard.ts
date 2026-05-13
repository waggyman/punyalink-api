import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StoreUserJwtAuthGuard extends AuthGuard('store-user-jwt') {}
