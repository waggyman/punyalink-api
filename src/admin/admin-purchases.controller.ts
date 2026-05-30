import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admins/admin-jwt.guard';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { AdminPurchaseListQueryDto } from './admin.dto';
import { AdminPurchasesService } from './admin-purchases.service';

@Controller('admin/purchases')
@UseGuards(AdminJwtAuthGuard)
@UsePipes(RequestValidationPipe)
export class AdminPurchasesController {
  constructor(private readonly adminPurchasesService: AdminPurchasesService) {}

  @Get()
  listPurchases(@Query() query: AdminPurchaseListQueryDto) {
    return this.adminPurchasesService.listPurchases(query);
  }

  @Get(':id')
  getPurchaseDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPurchasesService.getPurchaseDetail(id);
  }
}
