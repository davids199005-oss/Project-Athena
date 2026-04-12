/**
 * @module admin.controller
 *
 * **Purpose:** Admin-only HTTP endpoints for dashboard statistics and review moderation.
 *
 * **Responsibilities:** Delegate to `AdminService`; enforce `RolesGuard` + `ADMIN` role at class level.
 *
 * **Integration notes:** Relies on global JWT auth plus role guard—misconfigured guards would expose stats.
 */

import { Controller, Delete, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('reviews')
  getReviews(@Query() query: QueryReviewsDto) {
    return this.adminService.findAllReviews(query);
  }

  @Delete('reviews/:id')
  async removeReview(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.removeReview(id);
    return { message: 'Review deleted successfully' };
  }
}
