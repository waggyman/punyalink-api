import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { MembershipCode } from './membership.types';

@Entity({ name: 'memberships' })
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: MembershipCode;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'price_idr', type: 'int', nullable: true })
  priceIdr: number | null;

  /** null = unlimited */
  @Column({ name: 'limit_collection', type: 'int', nullable: true })
  limitCollection: number | null;

  /** null = unlimited */
  @Column({ name: 'limit_collection_link', type: 'int', nullable: true })
  limitCollectionLink: number | null;

  @Column({ name: 'can_custom_link', type: 'boolean', default: false })
  canCustomLink: boolean;

  @Column({ name: 'can_custom_link_collection', type: 'boolean', default: false })
  canCustomLinkCollection: boolean;

  @Column({ name: 'duration_days', type: 'int', nullable: true })
  durationDays: number | null;

  @Column({ name: 'grace_renewal_days', type: 'int', nullable: true })
  graceRenewalDays: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
