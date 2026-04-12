/**
 * @module jwt-auth.guard
 *
 * **Purpose:** Global default-deny JWT authentication with an opt-out `@Public()` metadata hook.
 *
 * **Responsibilities:** Skip activation for routes marked public; otherwise delegate to Passport `jwt` strategy.
 *
 * **Integration notes:** Registered globally—ordering with `ThrottlerGuard` and route metadata matters for early exits.
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT guard (APP_GUARD): default deny; @Public() skips JWT via IS_PUBLIC_KEY.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // @Public() on handler or controller
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Default: AuthGuard('jwt')
    return super.canActivate(context);
  }
}