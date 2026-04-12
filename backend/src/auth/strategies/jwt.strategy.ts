/**

 * @module jwt.strategy

 *

 * **Purpose:** Validate access tokens and hydrate `request.user` with a fresh DB user record.

 *

 * **Responsibilities:** Extract JWT from Authorization header; verify signature/expiry; load user by id; reject blocked/invalid accounts.

 *

 * **Integration notes:** Adds a DB round-trip per request—caching would be an optimization outside this class.

 */



import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { InjectRepository } from '@nestjs/typeorm';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';



/**

 * JWT access-token strategy (`AuthGuard('jwt')`): extract Bearer token, verify signature, then load user from DB.

 */

@Injectable()

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

  constructor(

    configService: ConfigService,

    @InjectRepository(User)

    private readonly userRepository: Repository<User>,

  ) {

    super({

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

    });

  }



  /**

   * Called only after signature verification. Loads the latest user row so role/block state cannot be stale vs token payload.

   */

  async validate(payload: { sub: string; role: string }) {

    const user = await this.userRepository.findOne({

      where: { id: payload.sub },

    });



    if (!user || user.isBlocked) {

      throw new UnauthorizedException();

    }



    return user;

  }

}

