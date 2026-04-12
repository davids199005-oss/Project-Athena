/**
 * @module google.strategy
 *
 * **Purpose:** Passport Google OAuth2 strategy for web login flows via Google identity provider.
 *
 * **Responsibilities:** Configure client ID/secret/callback; map profile fields into `validateOAuthUser` payloads.
 *
 * **Integration notes:** Callback URL must match Google Cloud console exactly; profile email availability depends on user consent.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

/**
 * Google OAuth2: browser hits /api/auth/google, user consents, callback runs validate() then JWT issuance.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      // Minimal OAuth scopes for sign-in
      scope: ['email', 'profile'],
    });
  }

  /**
   * Runs after Google auth. Google access/refresh tokens are for Google APIs only; we only need profile for JWT.
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    // Map Google profile to our user shape
    const user = {
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName || '',
      avatarUrl: profile.photos?.[0]?.value || null,
      oauthProvider: 'google',
      oauthId: profile.id,
    };

    // Passport callback: done(null, user) attaches user to the request
    done(null, user);
  }
}