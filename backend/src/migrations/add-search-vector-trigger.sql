-- 001-add-search-vector-trigger.sql
-- Полнотекстовый поиск по книгам через tsvector.
--
-- Что делает этот скрипт:
-- 1. Создаёт функцию, которая объединяет title + author + description в tsvector
-- 2. Создаёт триггер, который вызывает эту функцию при INSERT/UPDATE
-- 3. Создаёт GIN-индекс на searchVector для быстрого поиска
-- 4. Обновляет searchVector для уже существующих книг в БД
--
-- Выполнить один раз в pgAdmin или psql:
-- \i path/to/001-add-search-vector-trigger.sql

-- ═══ 1. Функция для генерации tsvector ═══
--
-- setweight() назначает вес лексемам:
--   'A' — высший приоритет (title) — совпадение по названию важнее всего
--   'B' — средний приоритет (author)
--   'C' — низший приоритет (description)
--
-- to_tsvector('english', ...) разбивает текст на лексемы:
--   "Programming in JavaScript" → 'program':1 'javascript':3
--   Слово "in" выбрасывается как стоп-слово.
--
-- coalesce(..., '') — защита от NULL: если description = NULL,
-- подставляется пустая строка (иначе весь tsvector станет NULL).
--
-- || — оператор конкатенации tsvector: объединяет три вектора в один.

CREATE OR REPLACE FUNCTION books_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══ 2. Триггер — вызывает функцию при каждом INSERT или UPDATE ═══
--
-- BEFORE INSERT OR UPDATE — срабатывает ДО записи в таблицу.
-- Это значит, что searchVector будет заполнен в момент вставки,
-- а не после (не нужен дополнительный UPDATE).
--
-- FOR EACH ROW — триггер срабатывает для каждой строки отдельно.

DROP TRIGGER IF EXISTS books_search_vector_trigger ON books;

CREATE TRIGGER books_search_vector_trigger
  BEFORE INSERT OR UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION books_search_vector_update();

-- ═══ 3. GIN-индекс для быстрого поиска ═══
--
-- GIN (Generalized Inverted Index) — специальный тип индекса для tsvector.
-- Без индекса PostgreSQL будет делать sequential scan (проверять каждую строку).
-- С GIN-индексом поиск работает через инвертированный индекс:
-- лексема → список строк, где она встречается.
--
-- Для 10 000 книг разница: ~50ms без индекса → ~1ms с индексом.

CREATE INDEX IF NOT EXISTS idx_books_search_vector
  ON books USING GIN ("searchVector");

-- ═══ 4. Обновить searchVector для существующих книг ═══
--
-- Триггер срабатывает только на новые INSERT/UPDATE.
-- Книги, которые уже в БД, имеют searchVector = NULL.
-- Этот UPDATE "пнёт" триггер для всех существующих записей.

UPDATE books SET title = title;