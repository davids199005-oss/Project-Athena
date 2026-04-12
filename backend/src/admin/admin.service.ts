/**
 * @module admin.service
 *
 * **Purpose:** Aggregates read-mostly operational metrics and admin moderation flows (reviews)
 * for dashboard-style consumers.
 *
 * **Responsibilities:** Compute dashboard stats across users, books, reviews, and AI usage;
 * paginate admin review listings with stable projection shapes; delete reviews and recompute
 * denormalized book rating aggregates.
 *
 * **Integration notes:** `removeReview` writes to `books` after deleting a `review`—callers
 * should expect extra queries and that averages depend on remaining reviews. Stats queries are
 * not cached; high traffic may warrant materialized views or caching outside this service.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { Review } from '../review/entities/review.entity';
import { AiChatSession } from '../ai/entities/ai-chat-session.entity';
import { AiLog } from '../ai/entities/ai-log.entity';

/**
 * Admin-facing analytics and moderation service backed by TypeORM repositories.
 *
 * **Concurrency / consistency:** Aggregate rating updates run after delete in the same request;
 * concurrent review writes on the same book could race—acceptable for typical admin volume.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(AiChatSession)
    private readonly aiSessionRepo: Repository<AiChatSession>,
    @InjectRepository(AiLog)
    private readonly aiLogRepo: Repository<AiLog>,
  ) {}

  /**
   * Loads dashboard counters and breakdowns in parallel to minimize latency.
   *
   * **Side effects:** Read-only against multiple tables; no cache invalidation.
   */
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [users, books, reviews, ai, recentActivity] = await Promise.all([
      this.getUserStats(startOfMonth),
      this.getBookStats(),
      this.getReviewStats(),
      this.getAiStats(),
      this.getRecentActivity(),
    ]);

    return { users, books, reviews, ai, recentActivity };
  }

  private async getUserStats(startOfMonth: Date) {
    const [total, newThisMonth, blocked, admins] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfMonth) },
      }),
      this.userRepo.count({ where: { isBlocked: true } }),
      this.userRepo.count({ where: { role: 'ADMIN' as any } }),
    ]);

    return { total, newThisMonth, blocked, admins };
  }

  private async getBookStats() {
    const total = await this.bookRepo.count();

    const byGenre = await this.bookRepo
      .createQueryBuilder('book')
      .select('book.genre', 'genre')
      .addSelect('COUNT(book.id)', 'count')
      .groupBy('book.genre')
      .getRawMany();

    const byFileType = await this.bookRepo
      .createQueryBuilder('book')
      .select('book.fileType', 'fileType')
      .addSelect('COUNT(book.id)', 'count')
      .groupBy('book.fileType')
      .getRawMany();

    return {
      total,
      byGenre: byGenre.map((r) => ({ genre: r.genre, count: Number(r.count) })),
      byFileType: byFileType.map((r) => ({ fileType: r.fileType, count: Number(r.count) })),
    };
  }

  private async getReviewStats() {
    const total = await this.reviewRepo.count();

    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .getRawOne();

    return {
      total,
      averageRating: result?.avg ? parseFloat(parseFloat(result.avg).toFixed(1)) : 0,
    };
  }

  private async getAiStats() {
    const totalSessions = await this.aiSessionRepo.count();

    const result = await this.aiLogRepo
      .createQueryBuilder('log')
      .select('COALESCE(SUM(log.tokensUsed), 0)', 'totalTokens')
      .getRawOne();

    return {
      totalSessions,
      totalTokensUsed: Number(result?.totalTokens || 0),
    };
  }

  /**
   * Paginated review listing with related user/book for moderation UI.
   *
   * **Projection:** Maps entities to a narrower DTO-like object to avoid leaking full user/book rows.
   */
  async findAllReviews(query: QueryReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const [data, total] = await this.reviewRepo.findAndCount({
      relations: ['user', 'book'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.user
          ? { id: r.user.id, firstName: r.user.firstName, lastName: r.user.lastName, email: r.user.email }
          : null,
        book: r.book
          ? { id: r.book.id, title: r.book.title, author: r.book.author }
          : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Deletes a review and recomputes the parent book's `rating` and `ratingsCount`.
   *
   * **Why recompute:** Book stars are denormalized for catalog performance; removing a review
   * must refresh aggregates. **Side effects:** Updates `books` row; throws if review missing.
   */
  async removeReview(id: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const { bookId } = review;
    await this.reviewRepo.remove(review);

    // Recalculate book rating
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.bookId = :bookId', { bookId })
      .getRawOne();

    await this.bookRepo.update(bookId, {
      rating: result?.avg ? parseFloat(result.avg) : 0,
      ratingsCount: parseInt(result?.count || '0', 10),
    });
  }

  private async getRecentActivity() {
    const [recentUsers, recentBooks, recentReviews] = await Promise.all([
      this.userRepo.find({
        select: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.bookRepo.find({
        select: ['id', 'title', 'author', 'genre', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.reviewRepo.find({
        relations: ['user', 'book'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      recentUsers,
      recentBooks,
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        user: r.user
          ? { id: r.user.id, firstName: r.user.firstName, lastName: r.user.lastName }
          : null,
        book: r.book
          ? { id: r.book.id, title: r.book.title }
          : null,
      })),
    };
  }
}
