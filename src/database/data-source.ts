import 'reflect-metadata';
import { join } from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Admin } from '../admins/admins.entity';
import { LinkCollectionMembership } from '../link-collections/link-collection-membership.entity';
import { TemporaryCollection } from '../link-collections/temporary-collection.entity';
import { Link } from '../links/links.entity';
import { Otp } from '../otp/otp.entity';
import { Store } from '../stores/stores.entity';
import { User } from '../users/users.entity';

dotenv.config();

// TypeORM CLI requires exactly one DataSource export in this file (no named + default).
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [
    Store,
    User,
    Admin,
    Otp,
    Link,
    TemporaryCollection,
    LinkCollectionMembership,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],

  synchronize: false,
  logging: false,
});
