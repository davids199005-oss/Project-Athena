/**
 * @module main
 *
 * **Purpose:** Bootstraps the NestJS HTTP server and applies cross-cutting HTTP concerns
 * (security headers, validation, serialization, CORS, static file serving) before listening.
 *
 * **Responsibilities:** Create the Nest application, wire global pipes/interceptors, expose
 * uploaded assets, start listening on `PORT`, then align PostgreSQL/pgvector runtime state with
 * what the AI search stack expects (`ensurePgvectorColumns`).
 *
 * **Integration notes:** Side effects on startup include creating upload directories via
 * `initUploadDirs()` (import side-effect) and mutating DB extension/column types after the app
 * is listening. Changing middleware order can affect CORS, Helmet, and static asset routing.
 */

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initUploadDirs } from './utils/init-uploads';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { ensurePgvectorColumns } from './utils/ensure-pgvector';
import { DataSource } from 'typeorm';
import { ClassSerializerInterceptor } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';


initUploadDirs();

/**
 * Builds the Nest application, applies global HTTP configuration, serves static uploads,
 * listens on the configured port, then runs pgvector alignment against the live `DataSource`.
 *
 * **Why this order:** Upload dirs must exist before any upload route runs; listening starts
 * the server; pgvector checks use a connected TypeORM pool (post-listen is acceptable here).
 *
 * **Side effects:** Mutates process-global Express middleware stack; triggers DB DDL/DML in
 * `ensurePgvectorColumns` (extension/column migration helpers).
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    methods: ['GET', 'POST', 'PUT', 'DELETE' , 'OPTIONS' , 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'covers'), {
    prefix: '/uploads/covers',
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'avatars'), {
    prefix: '/uploads/avatars',
  });

  await app.listen(configService.get('PORT') || 4000);
  console.log(`Server is running on port ${configService.get('PORT')} ✔️`);
  const dataSource = app.get(DataSource);
  await ensurePgvectorColumns(dataSource);
}
bootstrap();
