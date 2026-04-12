/**
 * @module jwt-refresh.strategy
 *
 * **Purpose:** Validate refresh tokens separately from access tokens using a distinct secret and extractor.
 *
 * **Responsibilities:** Pass through refresh token string to guards for `AuthService.refreshTokens` to compare hashed storage.
 *
 * **Integration notes:** Must stay aligned with how refresh tokens are issued client-side (cookie vs body).
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

/**
 * Refresh-token validation: name `jwt-refresh`, separate secret, passes req for raw token vs DB hash.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // passReqToCallback: validate(req, payload, ...)
      passReqToCallback: true,
    });
  }

  /**
   * Returns userId, role, and raw refresh token for AuthService.refreshTokens().
   */
  validate(req: Request, payload: { sub: string; role: string }) {
    // Bearer token from Authorization
    const refreshToken = req.get('Authorization')?.replace('Bearer ', '').trim();

    return {
      userId: payload.sub,
      role: payload.role,
      refreshToken,
    };
  }
}