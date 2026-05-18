import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from '../links/links.entity';
import { AnalyticsService } from './analytics.service';
import { LinkAnalyticsEvent } from './link-analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LinkAnalyticsEvent, Link])],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
