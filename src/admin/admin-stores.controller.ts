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
import { AdminStoreListQueryDto } from './admin.dto';
import { AdminStoresService } from './admin-stores.service';

@Controller('admin/stores')
@UseGuards(AdminJwtAuthGuard)
@UsePipes(RequestValidationPipe)
export class AdminStoresController {
  constructor(private readonly adminStoresService: AdminStoresService) {}

  @Get()
  listStores(@Query() query: AdminStoreListQueryDto) {
    return this.adminStoresService.listStores(query);
  }

  @Get(':id')
  getStoreDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminStoresService.getStoreDetail(id);
  }
}
