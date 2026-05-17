import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

function parseCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
  }
  if (raw === '*') {
    return true;
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function tenantHeaderNameForCors(): string {
  const custom = process.env.TENANT_SUBDOMAIN_HEADER?.trim();
  return custom && custom.length > 0
    ? custom.toLowerCase()
    : 'x-tenant-subdomain';
}

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter() as never,
  );

  const tenantHeader = tenantHeaderNameForCors();
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      tenantHeader,
      'X-Tenant-Subdomain',
    ],
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
