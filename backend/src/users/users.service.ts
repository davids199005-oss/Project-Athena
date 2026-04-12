/**

 * @module users.service

 *

 * **Purpose:** User profile domain logic including avatar file lifecycle and credential/email updates.

 *

 * **Responsibilities:** Enforce self-vs-admin authorization; hash passwords on change; delete stale avatar files from disk.

 *

 * **Integration notes:** Email uniqueness checks touch the DB; race conditions could still surface as constraint errors at save time.

 */



// src/users/users.service.ts



import {

  BadRequestException,

  ConflictException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

import { UpdateUserDto } from './dto/update-user.dto';

import { ChangeRoleDto } from './dto/change-role.dto';

import { ChangePasswordDto } from './dto/change-password.dto';

import { ChangeEmailDto } from './dto/change-email.dto';

import { hashPassword, verifyPassword } from '../auth/utils/password.util';



/**

 * Profile CRUD and admin user management (AuthService owns register/login).

 */

@Injectable()

export class UsersService {

  constructor(

    @InjectRepository(User)

    private readonly userRepository: Repository<User>,

  ) {}



  /**

   * Load by id or 404; safe for other modules to reuse.

   */

  async findById(id: string): Promise<User> {

    const user = await this.userRepository.findOne({ where: { id } });



    if (!user) {

      throw new NotFoundException('User not found');

    }



    return user;

  }



  /**

   * Current user profile without secrets.

   */

  async getMe(userId: string) {

    const user = await this.findById(userId);

    return this.sanitizeUser(user);

  }



  /**

   * PATCH fields present in dto only (Object.assign + save).

   */

  async updateProfile(userId: string, dto: UpdateUserDto) {

    const user = await this.findById(userId);



    Object.assign(user, dto);



    const updatedUser = await this.userRepository.save(user);

    return this.sanitizeUser(updatedUser);

  }



  async changePassword(userId: string, dto: ChangePasswordDto) {

    const user = await this.userRepository.findOne({ where: { id: userId } });



    if (!user) {

      throw new NotFoundException('User not found');

    }



    if (!user.passwordHash) {

      throw new BadRequestException('OAuth users cannot change password');

    }



    const isValid = await verifyPassword(dto.currentPassword, user.passwordHash);

    if (!isValid) {

      throw new BadRequestException('Current password is incorrect');

    }



    user.passwordHash = await hashPassword(dto.newPassword);

    await this.userRepository.save(user);



    return { message: 'Password changed successfully' };

  }



  async changeEmail(userId: string, dto: ChangeEmailDto) {

    const user = await this.userRepository.findOne({ where: { id: userId } });



    if (!user) {

      throw new NotFoundException('User not found');

    }



    if (!user.passwordHash) {

      throw new BadRequestException('OAuth users cannot change email');

    }



    const isValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isValid) {

      throw new BadRequestException('Password is incorrect');

    }



    const existing = await this.userRepository.findOne({

      where: { email: dto.newEmail },

    });



    if (existing && existing.id !== userId) {

      throw new ConflictException('Email already in use');

    }



    user.email = dto.newEmail;

    await this.userRepository.save(user);



    return this.sanitizeUser(user);

  }



  async updateAvatar(userId: string, avatarPath: string) {

    const user = await this.findById(userId);

    user.avatarUrl = avatarPath;

    const updated = await this.userRepository.save(user);

    return this.sanitizeUser(updated);

  }



  /**

   * Admin: all users, newest first, sanitized.

   */

  async findAll() {

    const users = await this.userRepository.find({

      order: { createdAt: 'DESC' },

    });



    return users.map((user) => this.sanitizeUser(user));

  }



  /**

   * Admin: change role; cannot target self (avoid locking yourself out).

   */

  async changeRole(targetUserId: string, dto: ChangeRoleDto, currentUserId: string) {

    if (targetUserId === currentUserId) {

      throw new ForbiddenException('You cannot change your own role');

    }



    const user = await this.findById(targetUserId);

    user.role = dto.role;



    const updatedUser = await this.userRepository.save(user);

    return this.sanitizeUser(updatedUser);

  }



  /**

   * Admin: toggle block; cannot block self.

   */

  async toggleBlock(targetUserId: string, currentUserId: string) {

    if (targetUserId === currentUserId) {

      throw new ForbiddenException('You cannot block yourself');

    }



    const user = await this.findById(targetUserId);

    user.isBlocked = !user.isBlocked;



    const updatedUser = await this.userRepository.save(user);

    return this.sanitizeUser(updatedUser);

  }



  private sanitizeUser(user: User) {

    const { passwordHash, refreshToken, ...sanitized } = user;

    return sanitized;

  }

}

