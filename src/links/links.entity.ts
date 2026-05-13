import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../stores/stores.entity';

@Entity({ name: 'links' })
@Unique('UQ_links_store_access', ['storeId', 'accessLink'])
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  image: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'external_link', type: 'varchar', length: 2048 })
  externalLink: string;

  @Column({ name: 'access_link', type: 'varchar', length: 120 })
  accessLink: string;

  @Column({ type: 'int', default: 0 })
  view: number;

  @Column({ type: 'int', default: 0 })
  click: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
