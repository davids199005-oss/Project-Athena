/**
 * @module review.service
 *
 * **Purpose:** Manage book reviews and keep denormalized book rating fields consistent.
 *
 * **Responsibilities:** Enforce one review per user/book; upsert aggregates on create/update/delete paths.
 *
 * **Integration notes:** Uses raw SQL aggregates for averages—concurrent writes may race briefly before save completes.
 */

import {
    Injectable,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Review } from './entities/review.entity';
  import { Book } from '../books/entities/book.entity';
  import { CreateReviewDto } from './dto/create-review.dto';
  import { UpdateReviewDto } from './dto/update-review.dto';
  
  @Injectable()
  export class ReviewService {
    constructor(
      @InjectRepository(Review)
      private readonly reviewRepo: Repository<Review>,
      @InjectRepository(Book)
      private readonly bookRepo: Repository<Book>,
    ) {}
  
    async create(
      userId: string,
      bookId: string,
      dto: CreateReviewDto,
    ): Promise<Review> {
      const existing = await this.reviewRepo.findOne({
        where: { userId, bookId },
      });
  
      if (existing) {
        throw new ConflictException('You already reviewed this book');
      }
  
      const review = this.reviewRepo.create({ userId, bookId, ...dto });
      const saved = await this.reviewRepo.save(review);
  
      await this.recalculateBookRating(bookId);
      return saved;
    }
  
    async update(
      userId: string,
      id: string,
      dto: UpdateReviewDto,
    ): Promise<Review> {
      const review = await this.reviewRepo.findOne({
        where: { id, userId },
      });
  
      if (!review) {
        throw new NotFoundException('Review not found');
      }
  
      Object.assign(review, dto);
      const saved = await this.reviewRepo.save(review);
  
      await this.recalculateBookRating(review.bookId);
      return saved;
    }
  
    async remove(userId: string, id: string): Promise<void> {
      const review = await this.reviewRepo.findOne({
        where: { id, userId },
      });
  
      if (!review) {
        throw new NotFoundException('Review not found');
      }
  
      const { bookId } = review;
      await this.reviewRepo.remove(review);
  
      await this.recalculateBookRating(bookId);
    }
  
    async getByBook(bookId: string): Promise<Review[]> {
      return this.reviewRepo.find({
        where: { bookId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    }
  
    private async recalculateBookRating(bookId: string): Promise<void> {
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
  }