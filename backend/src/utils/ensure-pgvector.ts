/**

 * @module ensure-pgvector

 *

 * **Purpose:** Post-startup alignment between TypeORM `synchronize` output and pgvector-native types/indexes.

 *

 * **Responsibilities:** Ensure `vector` extension; coerce `embedding_vec` from text to `vector(1536)` when needed; backfill vectors; warn on missing IVFFlat index.

 *

 * **Integration notes:** Swallows errors with logging—AI search may be degraded silently if extension DDL fails. Runs after HTTP listen; brief lock contention possible on large tables.

 */



import { DataSource } from 'typeorm';

import { Logger } from '@nestjs/common';



/**

 * Ensure pgvector extension and embedding column types; called after app.listen() in main.ts.

 */

export async function ensurePgvectorColumns(dataSource: DataSource): Promise<void> {

  const logger = new Logger('EnsurePgvector');



  try {

    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    logger.log('pgvector extension verified');



    await dataSource.query(`

      DO $$

      BEGIN

        IF EXISTS (

          SELECT 1 FROM information_schema.columns

          WHERE table_name = 'book_chunks' AND column_name = 'embedding_vec' AND data_type = 'text'

        ) THEN

          ALTER TABLE book_chunks ALTER COLUMN embedding_vec TYPE vector(1536) USING embedding_vec::vector(1536);

          RAISE NOTICE 'Converted embedding_vec from text to vector(1536)';

        END IF;

      END $$;

    `);

    logger.log('embedding_vec column type verified as vector(1536)');



    const migrated = await dataSource.query(`

      UPDATE book_chunks

      SET embedding_vec = embedding::vector(1536)

      WHERE embedding IS NOT NULL AND embedding_vec IS NULL

    `);

    if (migrated[1] > 0) {

      logger.log(`Migrated ${migrated[1]} embeddings from text to vector column`);

    }



    const indexCheck = await dataSource.query(

      `SELECT indexname FROM pg_indexes WHERE tablename = 'book_chunks' AND indexname = 'idx_book_chunks_embedding_ivfflat'`,

    );

    if (indexCheck.length > 0) {

      logger.log('IVFFlat index verified on book_chunks.embedding_vec');

    } else {

      logger.warn('IVFFlat index not found — run migration 002 after accumulating data');

    }

  } catch (error) {

    logger.error('Failed to ensure pgvector extension', error);

  }

}

