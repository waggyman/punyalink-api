import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Link } from '../links/links.entity';
import { Store } from '../stores/stores.entity';

export type LinkAnalyticsEventType = 'view' | 'click';

@Entity({ name: 'link_analytics_events' })
@Index('IDX_link_analytics_store_created', ['storeId', 'createdAt'])
@Index('IDX_link_analytics_link_type_created', [
  'linkId',
  'eventType',
  'createdAt',
])
export class LinkAnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'link_id', type: 'uuid' })
  linkId: string;

  @ManyToOne(() => Link, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'link_id' })
  link: Link;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'event_type', type: 'varchar', length: 10 })
  eventType: LinkAnalyticsEventType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
