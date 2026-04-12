/**

 * @module roles.guard

 *

 * **Purpose:** Enforce RBAC using roles attached to the request user after JWT validation.

 *

 * **Responsibilities:** Read `@Roles()` metadata; compare against `request.user.role`; deny when missing/insufficient.

 *

 * **Integration notes:** Must run after an auth guard that populates `request.user`; otherwise rejects valid routes.

 */



import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { UserRole } from '../../users/entities/user.entity';

import { ROLES_KEY } from '../decorators/roles.decorator';



/**

 * RBAC after JWT: @UseGuards(JwtAuthGuard, RolesGuard) with @Roles(...).

 */

@Injectable()

export class RolesGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) {}



  canActivate(context: ExecutionContext): boolean {

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(

      ROLES_KEY,

      [context.getHandler(), context.getClass()],

    );



    if (!requiredRoles || requiredRoles.length === 0) {

      return true;

    }



    const { user } = context.switchToHttp().getRequest();



    return requiredRoles.includes(user.role);

  }

}

