/**
 * @module update-review.dto
 *
 * **Purpose:** Partial updates for an existing review using shared validation from `CreateReviewDto`.
 *
 * **Responsibilities:** Reuse `PartialType` to avoid duplicating decorators.
 *
 * **Integration notes:** Empty bodies may be rejected depending on global ValidationPipe settings.
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}