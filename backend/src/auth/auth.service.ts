/**

 * @module auth.service

 *

 * **Purpose:** Credential and OAuth authentication: registration, login, JWT issuance, refresh

 * rotation, logout, and OAuth user provisioning.

 *

 * **Responsibilities:** Hash passwords; enforce lockout and block flags; mint access/refresh tokens;

 * store hashed refresh tokens; strip secrets from user projections; create default collections on signup.

 *

 * **Integration notes:** Refresh tokens are verified against bcrypt hashes—replay requires the raw token

 * from the client. OAuth branch links by email only; merging strategies for duplicate providers are

 * out of scope here.

 */



import {

  BadRequestException,

  Injectable,

  Logger,

  UnauthorizedException,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity';

import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';

import { hashPassword, verifyPassword } from './utils/password.util';

import { CollectionService } from '../collection/collection.service';



/**

 * Core authentication service (local credentials + OAuth handoff).

 *

 * **Security notes:** Uses `scrypt`-based hashing via shared helpers; JWT payload stays minimal

 * (`sub`, `role`) to keep tokens small and avoid leaking PII in base64 payloads.

 */

@Injectable()

export class AuthService {

  private readonly logger = new Logger(AuthService.name);



  constructor(

    @InjectRepository(User)

    private readonly userRepository: Repository<User>,



    private readonly jwtService: JwtService,



    private readonly configService: ConfigService,



    private readonly collectionService: CollectionService,

  ) {}



  /**

   * Registers a password user, seeds default collections, and returns sanitized user + tokens.

   *

   * **Side effects:** Persists user, hashed refresh token, and collection rows.

   */

  async register(dto: RegisterDto) {

    const existingUser = await this.userRepository.findOne({

      where: { email: dto.email },

    });



    if (existingUser) {

      // Generic message to avoid email enumeration

      throw new BadRequestException('Invalid email or password');

    }



    const passwordHash = await hashPassword(dto.password);



    const user = this.userRepository.create({

      email: dto.email,

      passwordHash,

      firstName: dto.firstName,

      lastName: dto.lastName,

      role: UserRole.USER,

    });



    const savedUser = await this.userRepository.save(user);



    await this.collectionService.createDefaultCollections(savedUser.id);



    const tokens = await this.generateTokens(savedUser);



    await this.updateRefreshToken(savedUser.id, tokens.refreshToken);



    return {

      user: this.sanitizeUser(savedUser),

      ...tokens,

    };

  }



  /**

   * Validates credentials, applies lockout rules, resets counters on success, returns tokens.

   *

   * **Side effects:** May update failed attempt counters and `lockoutUntil` before throwing.

   */

  async login(dto: LoginDto) {

    const user = await this.userRepository.findOne({

      where: { email: dto.email },

    });



    if (!user || !user.passwordHash) {

      this.logger.warn(`Failed login attempt for: ${this.maskEmail(dto.email)} — user not found or OAuth-only`);

      throw new UnauthorizedException('Invalid email or password');

    }



    // Check block status before password verification to avoid leaking password validity
    // and wasting CPU on scrypt for blocked accounts
    if (user.isBlocked) {

      this.logger.warn(`Blocked user attempted login: ${this.maskEmail(dto.email)}`);

      throw new UnauthorizedException('Account is blocked');

    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {

      this.logger.warn(`Locked out user attempted login: ${this.maskEmail(dto.email)}`);

      throw new UnauthorizedException('Account is temporarily locked. Try again later.');

    }



    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);



    if (!isPasswordValid) {

      user.failedLoginAttempts += 1;

      this.logger.warn(`Failed login attempt #${user.failedLoginAttempts} for: ${this.maskEmail(dto.email)}`);



      if (user.failedLoginAttempts >= 5) {

        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);

        this.logger.warn(`Account locked for 15 minutes: ${this.maskEmail(dto.email)}`);

      }



      await this.userRepository.save(user);

      throw new UnauthorizedException('Invalid email or password');

    }



    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {

      user.failedLoginAttempts = 0;

      user.lockoutUntil = null;

      await this.userRepository.save(user);

    }



    const tokens = await this.generateTokens(user);

    await this.updateRefreshToken(user.id, tokens.refreshToken);



    return {

      user: this.sanitizeUser(user),

      ...tokens,

    };

  }



  /**

   * Rotates refresh token after bcrypt comparison with stored hash (one-time rotation per call).

   */

  async refreshTokens(userId: string, refreshToken: string) {

    const user = await this.userRepository.findOne({

      where: { id: userId },

    });



    if (!user || !user.refreshToken) {

      this.logger.warn(`Failed refresh attempt for userId: ${userId} — user not found or no refresh token`);

      throw new UnauthorizedException('Access denied');

    }



    const isTokenValid = await verifyPassword(refreshToken, user.refreshToken);



    if (!isTokenValid) {

      this.logger.warn(`Failed refresh attempt for userId: ${userId} — invalid refresh token`);

      throw new UnauthorizedException('Access denied');

    }



    const tokens = await this.generateTokens(user);

    await this.updateRefreshToken(user.id, tokens.refreshToken);



    return tokens;

  }



  async logout(userId: string) {

    await this.userRepository.update(userId, { refreshToken: null });

  }



  async validateOAuthUser(profile: {

    email: string;

    firstName: string;

    lastName: string;

    avatarUrl?: string;

    oauthProvider: string;

    oauthId: string;

  }) {

    let user = await this.userRepository.findOne({

      where: { email: profile.email },

    });



    if (!user) {

      user = this.userRepository.create({

        email: profile.email,

        firstName: profile.firstName,

        lastName: profile.lastName,

        avatarUrl: profile.avatarUrl || null,

        oauthProvider: profile.oauthProvider,

        oauthId: profile.oauthId,

        passwordHash: null,

        role: UserRole.USER,

      });

      user = await this.userRepository.save(user);



      await this.collectionService.createDefaultCollections(user.id);

    }



    const tokens = await this.generateTokens(user);

    await this.updateRefreshToken(user.id, tokens.refreshToken);



    return {

      user: this.sanitizeUser(user),

      ...tokens,

    };

  }



  /**

   * Mint access + refresh JWTs with minimal payload `{ sub, role }` (no PII—JWT is only signed, not encrypted).

   */

  private async generateTokens(user: User) {

    const payload = { sub: user.id, role: user.role };

    const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessExpiresIn = this.configService.getOrThrow<JwtSignOptions['expiresIn']>(

      'JWT_ACCESS_EXPIRATION',

    );

    const refreshExpiresIn = this.configService.getOrThrow<JwtSignOptions['expiresIn']>(

      'JWT_REFRESH_EXPIRATION',

    );

    const [accessToken, refreshToken] = await Promise.all([

      this.jwtService.signAsync(payload, {

        secret: accessSecret,

        expiresIn: accessExpiresIn,

      }),

      this.jwtService.signAsync(payload, {

        secret: refreshSecret,

        expiresIn: refreshExpiresIn,

      }),

    ]);

    return { accessToken, refreshToken };

  }



  /**

   * Persist scrypt hash of refresh token (never store raw refresh tokens).

   */

  private async updateRefreshToken(userId: string, refreshToken: string) {

    const hashedToken = await hashPassword(refreshToken);

    await this.userRepository.update(userId, { refreshToken: hashedToken });

  }



  private sanitizeUser(user: User) {

    const { passwordHash, refreshToken, ...sanitizedUser } = user;

    return sanitizedUser;

  }

  /** Mask email for logging: "user@example.com" → "u***@e***.com" */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const domainParts = domain.split('.');
    const maskedLocal = local[0] + '***';
    const maskedDomain = domainParts[0][0] + '***.' + domainParts.slice(1).join('.');
    return `${maskedLocal}@${maskedDomain}`;
  }

}

