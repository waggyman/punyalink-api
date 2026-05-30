import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admins/admin-jwt.guard';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { AdminAddMembershipDto } from './memberships.dto';
import { MembershipsService } from './memberships.service';

@Controller('admin')
@UsePipes(RequestValidationPipe)
export class AdminMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post('add-membership')
  @UseGuards(AdminJwtAuthGuard)
  addMembership(@Body() body: AdminAddMembershipDto) {
    return this.membershipsService.adminAddMembership(
      body.userId,
      body.storeId,
    );
  }
}
