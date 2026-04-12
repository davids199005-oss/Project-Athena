-- 002-add-ivfflat-embedding-index.sql
-- Добавляет колонку embedding_vec vector(1536) и IVFFlat индекс
-- для ускорения cosine similarity поиска.
--
-- ВАЖНО: выполнять ПОСЛЕ накопления данных (минимум 500-1000 чанков).
-- IVFFlat нуждается в репрезентативных данных для построения кластеров.

-- Шаг 1: Добавить vector-колонку
ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

-- Шаг 2: Мигрировать существующие эмбеддинги text → vector
UPDATE book_chunks
SET embedding_vec = embedding::vector(1536)
WHERE embedding IS NOT NULL AND embedding_vec IS NULL;

-- Шаг 3: Создать IVFFlat индекс
-- lists = кол-во кластеров. Правило: sqrt(кол-во строк).
-- 100 подходит для ~10K чанков. Пересоздать при росте данных.
CREATE INDEX IF NOT EXISTS idx_book_chunks_embedding_ivfflat
ON book_chunks USING ivfflat (embedding_vec vector_cosine_ops)
WITH (lists = 100);
