import { Controller, Get, Param } from '@nestjs/common';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('subdomain/:subdomain/availability')
  checkSubdomainAvailability(@Param('subdomain') subdomain: string) {
    return this.storesService.checkSubdomainAvailability(subdomain);
  }
}
