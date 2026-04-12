/**
 * @module current-user.decorator
 *
 * **Purpose:** Typed parameter decorator to extract authenticated user from the Nest request context.
 *
 * **Responsibilities:** Read `request.user` populated by Passport strategies/guards.
 *
 * **Integration notes:** Undefined when used on unauthenticated routes—callers should guard routes appropriately.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — typed access to `request.user` without @Req().
 * Optional property: @CurrentUser('id'), @CurrentUser('role'), etc.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Return one field when `data` is set
    return data ? user?.[data] : user;
  },
);