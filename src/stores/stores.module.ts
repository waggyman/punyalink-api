import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresController } from './stores.controller';
import { Store } from './stores.entity';
import { StoresService } from './stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
