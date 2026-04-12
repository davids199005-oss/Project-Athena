/**
 * @module auth.module
 *
 * **Purpose:** Wire Passport JWT strategies, OAuth strategies, auth controller, and token utilities.
 *
 * **Responsibilities:** Register `User` repository for `AuthService`; export `AuthService`/`JwtModule` for other modules; configure dynamic JWT settings from config.
 *
 * **Integration notes:** OAuth strategies require callback URLs in env validation; missing provider secrets fail startup.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { CollectionModule } from '../collection/collection.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    PassportModule,

    // JwtModule without global options: access/refresh use different secrets; secrets passed in AuthService.signAsync.
    JwtModule.register({}),

    CollectionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    GitHubStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}