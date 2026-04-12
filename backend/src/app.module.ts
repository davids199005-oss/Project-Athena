/**
 * @module app.module
 *
 * **Purpose:** Root NestJS composition root wiring feature modules, database connectivity,
 * configuration, and global guards for the Athena backend API.
 *
 * **Responsibilities:** Register throttling, validated environment config, TypeORM to PostgreSQL,
 * and domain modules (books, users, auth, AI, admin, reading, reviews, collections, notifications).
 * Installs `JwtAuthGuard` and `ThrottlerGuard` as global guards (order matters with Nest).
 *
 * **Integration notes:** `TypeOrmModule.forRootAsync` uses `synchronize: true` (schema managed by
 * TypeORM at runtime—avoid for production without review). Env validation runs at ConfigModule init;
 * missing/invalid env vars fail fast before listeners start.
 */

import { Module } from '@nestjs/common';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import { ReadingModule } from './reading/reading.module';
import { ReviewModule } from './review/review.module';
import { CollectionModule } from './collection/collection.module';
import { NotificationModule } from './notification/notification.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'medium',
        ttl: 100000,
        limit: 200,
      },
      {
        name: 'long',
        ttl: 600000,
        limit: 1000,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    BooksModule,
    UsersModule,
    AuthModule,
    AiModule,
    AdminModule,
    ReadingModule,
    ReviewModule,
    CollectionModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
