import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'otps' })
@Index('IDX_otps_target', ['target'])
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  target: string;

  @Column({ type: 'varchar', length: 10 })
  value: string;

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt: Date;

  /** `register` | `password_reset` */
  @Column({ type: 'varchar', length: 32, default: 'register' })
  purpose: string;
}
