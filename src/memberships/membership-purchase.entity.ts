import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';

export type MembershipPurchaseStatus =
  | 'pending'
  | 'receipt_submitted'
  | 'approved'
  | 'rejected';

@Entity({ name: 'membership_purchases' })
export class MembershipPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'invoice_amount', type: 'int' })
  invoiceAmount: number;

  @Column({ name: 'bank_account_number', type: 'varchar', length: 64 })
  bankAccountNumber: string;

  @Column({ name: 'bank_account_name', type: 'varchar', length: 255 })
  bankAccountName: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: MembershipPurchaseStatus;

  @Column({ name: 'receipt_image_key', type: 'varchar', length: 128, nullable: true })
  receiptImageKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
