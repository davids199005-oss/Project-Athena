/**
 * @module collection.service
 *
 * **Purpose:** Domain logic for collections, book membership, and default collection seeding on signup.
 *
 * **Responsibilities:** Maintain join rows; prevent duplicates; validate book existence when adding to collection.
 *
 * **Integration notes:** Default collection creation is invoked from `AuthService`—failures there could leave users without shelves.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CollectionBook } from './entities/collection-book.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

const DEFAULT_COLLECTIONS = [
  { name: 'Want to read', position: 0 },
  { name: 'Reading', position: 1 },
  { name: 'Read', position: 2 },
];

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionBook)
    private readonly collectionBookRepo: Repository<CollectionBook>,
  ) {}

  // ─── Default Collections ───

  async createDefaultCollections(userId: string): Promise<void> {
    const collections = DEFAULT_COLLECTIONS.map((c) =>
      this.collectionRepo.create({
        userId,
        name: c.name,
        position: c.position,
        isDefault: true,
      }),
    );

    await this.collectionRepo.save(collections);
  }

  // ─── Collection CRUD ───

  async create(userId: string, dto: CreateCollectionDto): Promise<Collection> {
    const existing = await this.collectionRepo.findOne({
      where: { userId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Collection with this name already exists');
    }

    const maxPosition = await this.collectionRepo
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.position), -1)', 'max')
      .where('c.userId = :userId', { userId })
      .getRawOne();

    const collection = this.collectionRepo.create({
      userId,
      name: dto.name,
      position: (maxPosition?.max ?? -1) + 1,
    });

    return this.collectionRepo.save(collection);
  }

  async findAll(userId: string): Promise<(Collection & { bookCount: number })[]> {
    const collections = await this.collectionRepo
      .createQueryBuilder('c')
      .loadRelationCountAndMap('c.bookCount', 'c.collectionBooks')
      .where('c.userId = :userId', { userId })
      .orderBy('c.position', 'ASC')
      .addOrderBy('c.createdAt', 'ASC')
      .getMany();

    return collections as (Collection & { bookCount: number })[];
  }

  async findOne(userId: string, id: string): Promise<Collection> {
    const collection = await this.collectionRepo.findOne({
      where: { id, userId },
      relations: ['collectionBooks', 'collectionBooks.book'],
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCollectionDto,
  ): Promise<Collection> {
    const collection = await this.collectionRepo.findOne({
      where: { id, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.isDefault) {
      throw new BadRequestException('Cannot rename default collection');
    }

    const duplicate = await this.collectionRepo.findOne({
      where: { userId, name: dto.name },
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Collection with this name already exists');
    }

    collection.name = dto.name;
    return this.collectionRepo.save(collection);
  }

  async remove(userId: string, id: string): Promise<void> {
    const collection = await this.collectionRepo.findOne({
      where: { id, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.isDefault) {
      throw new BadRequestException('Cannot delete default collection');
    }

    await this.collectionRepo.remove(collection);
  }

  // ─── Collection Books ───

  async addBook(
    userId: string,
    collectionId: string,
    bookId: string,
  ): Promise<CollectionBook> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const existing = await this.collectionBookRepo.findOne({
      where: { collectionId, bookId },
    });

    if (existing) {
      throw new ConflictException('Book already in this collection');
    }

    const entry = this.collectionBookRepo.create({ collectionId, bookId });
    return this.collectionBookRepo.save(entry);
  }

  async removeBook(
    userId: string,
    collectionId: string,
    bookId: string,
  ): Promise<void> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const entry = await this.collectionBookRepo.findOne({
      where: { collectionId, bookId },
    });

    if (!entry) {
      throw new NotFoundException('Book not in this collection');
    }

    await this.collectionBookRepo.remove(entry);
  }

  async getBookCollections(userId: string, bookId: string): Promise<Collection[]> {
    return this.collectionRepo
      .createQueryBuilder('c')
      .innerJoin('c.collectionBooks', 'cb', 'cb.bookId = :bookId', { bookId })
      .where('c.userId = :userId', { userId })
      .orderBy('c.position', 'ASC')
      .getMany();
  }
}
