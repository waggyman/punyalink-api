import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../links/links.entity';
import {
  LinkAnalyticsEvent,
  type LinkAnalyticsEventType,
} from './link-analytics-event.entity';

export type DailyCountRow = { date: string; count: number };

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LinkAnalyticsEvent)
    private readonly eventsRepository: Repository<LinkAnalyticsEvent>,
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
  ) {}

  async recordEvent(
    linkId: string,
    storeId: string,
    eventType: LinkAnalyticsEventType,
  ): Promise<void> {
    await this.eventsRepository.save(
      this.eventsRepository.create({ linkId, storeId, eventType }),
    );
    await this.linksRepository.increment({ id: linkId }, eventType, 1);
  }

  async recordVisit(linkId: string, storeId: string): Promise<void> {
    await this.recordEvent(linkId, storeId, 'view');
    await this.recordEvent(linkId, storeId, 'click');
  }

  async viewsPerDay(storeId: string, days: number): Promise<DailyCountRow[]> {
    return this.countPerDay(storeId, 'view', days);
  }

  async clicksPerDay(storeId: string, days: number): Promise<DailyCountRow[]> {
    return this.countPerDay(storeId, 'click', days);
  }

  async topClickedLinks(storeId: string, limit: number) {
    return this.linksRepository.find({
      where: { storeId },
      order: { click: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  private async countPerDay(
    storeId: string,
    eventType: LinkAnalyticsEventType,
    days: number,
  ): Promise<DailyCountRow[]> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const rows = await this.eventsRepository
      .createQueryBuilder('e')
      .select('DATE(e.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.store_id = :storeId', { storeId })
      .andWhere('e.event_type = :eventType', { eventType })
      .andWhere('e.created_at >= :since', { since })
      .groupBy('DATE(e.created_at)')
      .orderBy('DATE(e.created_at)', 'ASC')
      .getRawMany<{ date: string | Date; count: string }>();

    const byDate = new Map<string, number>();
    for (const row of rows) {
      const d =
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date).slice(0, 10);
      byDate.set(d, Number(row.count));
    }

    const result: DailyCountRow[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: byDate.get(key) ?? 0 });
    }
    return result;
  }
}
