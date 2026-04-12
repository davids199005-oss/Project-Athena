/**
 * @module github.strategy
 *
 * **Purpose:** Passport GitHub OAuth2 strategy for web login flows via GitHub identity provider.
 *
 * **Responsibilities:** Configure client credentials; request email scope; normalize profile names into first/last fields.
 *
 * **Integration notes:** GitHub may hide emails—service layer must handle missing email edge cases if they occur.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

/**
 * GitHub OAuth2 strategy (same overall flow as Google with GitHub-specific profile fields).
 */
@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      // Request email access (may still be hidden by user settings)
      scope: ['user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ) {
    // Split displayName into first/last; single token goes to firstName.
    const nameParts = (profile.displayName || profile.username || '').split(' ');
    const firstName = nameParts[0] || profile.username || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Email may be missing; profile.emails is [{ value, primary }, ...].
    const email = profile.emails?.[0]?.value || null;

    const user = {
      email,
      firstName,
      lastName,
      avatarUrl: profile.photos?.[0]?.value || null,
      oauthProvider: 'github',
      oauthId: profile.id,
    };

    done(null, user);
  }
}