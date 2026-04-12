/**
 * @module reading.module
 *
 * **Purpose:** Nest module encapsulating reading-list entities and user reading domain services.
 *
 * **Responsibilities:** Register TypeORM features for progress/bookmark/favorite/highlight/quote tables.
 *
 * **Integration notes:** Does not import Books module—foreign keys are enforced at DB level when present.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Favorite } from './entities/favorite.entity';
import { Quote } from './entities/quote.entity';
import { ReadingProgress } from './entities/reading-progress.entity';
import { ReadingService } from './reading.service';
import { ReadingController } from './reading.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Bookmark, Favorite, Quote, ReadingProgress])],
    controllers: [ReadingController],
    providers: [ReadingService],
    exports: [TypeOrmModule, ReadingService]
})
export class ReadingModule {}
