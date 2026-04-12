/**

 * @module update-book.dto

 *

 * **Purpose:** Partial updates for book metadata without requiring the full create payload.

 *

 * **Responsibilities:** Reuse validation rules from `CreateBookDto` via `PartialType` for DRY updates.

 *

 * **Integration notes:** Does not carry file fields—cover/book file changes use dedicated endpoints.

 */



// src/books/dto/update-book.dto.ts



import { PartialType } from '@nestjs/mapped-types';

import { CreateBookDto } from './create-book.dto';



/**

 * ADMIN metadata PATCH (PartialType(CreateBookDto)). Binary files use separate routes.

 */

export class UpdateBookDto extends PartialType(CreateBookDto) {}

