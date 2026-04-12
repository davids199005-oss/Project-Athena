/**

 * @module users.controller

 *

 * **Purpose:** Authenticated user profile endpoints (self-service and admin role updates).

 *

 * **Responsibilities:** Map DTOs to `UsersService`; wire multipart avatar upload; expose paginated user lists for admins.

 *

 * **Integration notes:** Some routes are admin-guarded—global JWT must supply `role` claims expected by guards.

 */



// src/users/users.controller.ts



import {

  Body,

  Controller,

  Get,

  Param,

  ParseUUIDPipe,

  Patch,

  Post,

  UploadedFile,

  UseGuards,

  UseInterceptors,

  BadRequestException,

} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';

import { UpdateUserDto } from './dto/update-user.dto';

import { ChangeRoleDto } from './dto/change-role.dto';

import { ChangePasswordDto } from './dto/change-password.dto';

import { ChangeEmailDto } from './dto/change-email.dto';

import { avatarStorage, avatarFileFilter } from './utils/avatar-upload';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole } from './entities/user.entity';



/**

 * `/me` routes must stay before `/:id` so `me` is not parsed as a UUID.

 */

@Controller('users')

export class UsersController {

  constructor(private readonly usersService: UsersService) {}



  // ═══════════════════════════════════════════

  // Current user

  // ═══════════════════════════════════════════



  /**

   * GET /api/users/me

   */

  @Get('me')

  getMe(@CurrentUser('id') userId: string) {

    return this.usersService.getMe(userId);

  }



  /**

   * PATCH /api/users/me — body validated by UpdateUserDto / global ValidationPipe.

   */

  @Patch('me')

  updateProfile(

    @CurrentUser('id') userId: string,

    @Body() dto: UpdateUserDto,

  ) {

    return this.usersService.updateProfile(userId, dto);

  }



  @Patch('me/password')

  changePassword(

    @CurrentUser('id') userId: string,

    @Body() dto: ChangePasswordDto,

  ) {

    return this.usersService.changePassword(userId, dto);

  }



  @Patch('me/email')

  changeEmail(

    @CurrentUser('id') userId: string,

    @Body() dto: ChangeEmailDto,

  ) {

    return this.usersService.changeEmail(userId, dto);

  }



  @Post('me/avatar')

  @UseInterceptors(

    FileInterceptor('avatar', {

      storage: avatarStorage,

      fileFilter: avatarFileFilter,

      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB

    }),

  )

  uploadAvatar(

    @CurrentUser('id') userId: string,

    @UploadedFile() file: Express.Multer.File,

  ) {

    if (!file) {

      throw new BadRequestException('Avatar file is required');

    }

    // Store URL-safe relative path, not OS filesystem path
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(userId, avatarUrl);

  }



  // ═══════════════════════════════════════════

  // Admin

  // ═══════════════════════════════════════════



  /**

   * GET /api/users — JwtAuthGuard + RolesGuard(ADMIN).

   */

  @Get()

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  findAll() {

    return this.usersService.findAll();

  }



  /**

   * PATCH /api/users/:id/role — ParseUUIDPipe validates :id format.

   */

  @Patch(':id/role')

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  changeRole(

    @Param('id', ParseUUIDPipe) targetUserId: string,

    @Body() dto: ChangeRoleDto,

    @CurrentUser('id') currentUserId: string,

  ) {

    return this.usersService.changeRole(targetUserId, dto, currentUserId);

  }



  /**

   * PATCH /api/users/:id/block — toggles isBlocked without a body.

   */

  @Patch(':id/block')

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  toggleBlock(

    @Param('id', ParseUUIDPipe) targetUserId: string,

    @CurrentUser('id') currentUserId: string,

  ) {

    return this.usersService.toggleBlock(targetUserId, currentUserId);

  }

}

