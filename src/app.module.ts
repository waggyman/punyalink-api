import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Admin } from './admins/admins.entity';
import { AdminsModule } from './admins/admins.module';
import { LinkCollectionMembership } from './link-collections/link-collection-membership.entity';
import { TemporaryCollection } from './link-collections/temporary-collection.entity';
import { Link } from './links/links.entity';
import { LinksModule } from './links/links.module';
import { Otp } from './otp/otp.entity';
import { Store } from './stores/stores.entity';
import { StoresModule } from './stores/stores.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';
import { User } from './users/users.entity';
import { OtpModule } from './otp/otp.module';
import { LinkCollectionsModule } from './link-collections/link-collections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          Store,
          User,
          Admin,
          Otp,
          Link,
          TemporaryCollection,
          LinkCollectionMembership,
        ],
        synchronize: false,
      }),
    }),
    TenantModule,
    UsersModule,
    StoresModule,
    LinksModule,
    AdminsModule,
    OtpModule,
    LinkCollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
