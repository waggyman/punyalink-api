import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AdminLoginDto, AdminRefreshDto } from './admins.dto';
import { AdminsService } from './admins.service';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';

@Controller('admin')
@UsePipes(RequestValidationPipe)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post('login')
  login(@Body() body: AdminLoginDto) {
    return this.adminsService.login(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: AdminRefreshDto) {
    return this.adminsService.refresh(body.refreshToken);
  }
}
