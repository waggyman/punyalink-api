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

/** Temporary per-store link bundle; shareable via `accessLink` until `expiredAt`. */
@Entity({ name: 'collections' })
@Unique('UQ_collections_store_access', ['storeId', 'accessLink'])
export class TemporaryCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'access_link', type: 'varchar', length: 120 })
  accessLink: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
