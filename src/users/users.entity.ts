import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../stores/stores.entity';
import type { SocialLinks } from './user-social-links';

@Entity({ name: 'users' })
@Index('IDX_users_store_id', ['storeId'])
@Index('IDX_users_email', ['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  /** Opaque filename key under `/images/` — never a full URL */
  @Column({ name: 'profile_image_key', type: 'varchar', length: 128, nullable: true })
  profileImageKey: string | null;

  @Column({ name: 'social_links', type: 'jsonb', default: () => "'{}'" })
  socialLinks: SocialLinks;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, (store) => store.users, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
