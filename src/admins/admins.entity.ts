import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'admins' })
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  refreshToken: string | null;

  @Column({
    name: 'refresh_token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
