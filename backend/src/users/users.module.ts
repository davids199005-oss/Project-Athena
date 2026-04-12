/**
 * @module users.module
 *
 * **Purpose:** Nest module for user profile persistence and HTTP API surface.
 *
 * **Responsibilities:** Register `User` with TypeORM; wire controller/service for CRUD-like profile operations.
 *
 * **Integration notes:** Avatar uploads depend on shared Multer config and static `/uploads/avatars` hosting.
 */

import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
