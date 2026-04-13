--
-- PostgreSQL database dump
--

\restrict yh1iHDwXarTg1pLUjJ6Y9txBNFdecbkVeLWadgnAgtey9xaLy6YcuLBKgdOhE8h

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-14 02:13:02

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 29920)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 2 (class 3079 OID 29592)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- TOC entry 1033 (class 1247 OID 30163)
-- Name: ai_chat_messages_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ai_chat_messages_role_enum AS ENUM (
    'user',
    'assistant'
);


ALTER TYPE public.ai_chat_messages_role_enum OWNER TO postgres;

--
-- TOC entry 1039 (class 1247 OID 30198)
-- Name: ai_logs_action_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ai_logs_action_enum AS ENUM (
    'summary',
    'chat',
    'recommendation',
    'embedding'
);


ALTER TYPE public.ai_logs_action_enum OWNER TO postgres;

--
-- TOC entry 1006 (class 1247 OID 29960)
-- Name: books_filetype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.books_filetype_enum AS ENUM (
    'EPUB',
    'PDF'
);


ALTER TYPE public.books_filetype_enum OWNER TO postgres;

--
-- TOC entry 1057 (class 1247 OID 43044)
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'NEW_BOOK',
    'SUMMARY_READY',
    'READING_REMINDER'
);


ALTER TYPE public.notifications_type_enum OWNER TO postgres;

--
-- TOC entry 1000 (class 1247 OID 29932)
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 30313)
-- Name: books_search_vector_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.books_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.books_search_vector_update() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 30167)
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sessionId" uuid NOT NULL,
    role public.ai_chat_messages_role_enum NOT NULL,
    content text NOT NULL,
    "tokensUsed" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_chat_messages OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 30147)
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_chat_sessions OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 30207)
-- Name: ai_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid,
    action public.ai_logs_action_enum NOT NULL,
    model character varying(50) NOT NULL,
    "tokensUsed" integer NOT NULL,
    "durationMs" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_logs OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 29992)
-- Name: book_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_chunks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "bookId" uuid NOT NULL,
    "chunkIndex" integer NOT NULL,
    content text NOT NULL,
    "chapterTitle" character varying(500),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    embedding text,
    embedding_vec public.vector(1536)
);


ALTER TABLE public.book_chunks OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 30012)
-- Name: book_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_summaries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "bookId" uuid NOT NULL,
    summary text NOT NULL,
    model character varying(50) NOT NULL,
    "tokensUsed" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_summaries OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 30034)
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookmarks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    "position" character varying(255) NOT NULL,
    title character varying(255),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bookmarks OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 29965)
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(500) NOT NULL,
    author character varying(255) NOT NULL,
    description text,
    genre character varying(100) NOT NULL,
    language character varying(50) NOT NULL,
    isbn character varying(20),
    "coverImageUrl" character varying(500),
    "pageCount" integer,
    "publishedYear" integer,
    "fileType" public.books_filetype_enum NOT NULL,
    "filePath" character varying(500) NOT NULL,
    rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    "ratingsCount" integer DEFAULT 0 NOT NULL,
    "searchVector" tsvector,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 38252)
-- Name: collection_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_books (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "collectionId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.collection_books OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 38267)
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    name character varying(255) NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.collections OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 30060)
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41058)
-- Name: highlights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.highlights (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    "position" character varying(500) NOT NULL,
    "cfiRange" text,
    "pageNumber" integer,
    color character varying(50) DEFAULT 'yellow'::character varying NOT NULL,
    "highlightedText" text NOT NULL,
    annotation text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.highlights OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 43051)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    type public.notifications_type_enum NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    link character varying(500),
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 41917)
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    text text NOT NULL,
    source character varying(500),
    note text,
    "cfiRange" text,
    "pageNumber" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 30085)
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reading_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    "currentPosition" character varying(255) NOT NULL,
    "progressPercent" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "lastReadAt" timestamp without time zone DEFAULT now() NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reading_progress OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 30117)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    rating integer NOT NULL,
    text text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 29937)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    "passwordHash" character varying(255),
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    "avatarUrl" character varying(500),
    role public.users_role_enum DEFAULT 'USER'::public.users_role_enum NOT NULL,
    "oauthProvider" character varying(50),
    "oauthId" character varying(255),
    "refreshToken" character varying(500),
    "isBlocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockoutUntil" timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5283 (class 2606 OID 38262)
-- Name: collection_books PK_1fe41b60657b25d7dfc1b2707d2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT "PK_1fe41b60657b25d7dfc1b2707d2" PRIMARY KEY (id);


--
-- TOC entry 5288 (class 2606 OID 38283)
-- Name: collections PK_21c00b1ebbd41ba1354242c5c4e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY (id);


--
-- TOC entry 5266 (class 2606 OID 30132)
-- Name: reviews PK_231ae565c273ee700b283f15c1d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY (id);


--
-- TOC entry 5260 (class 2606 OID 30102)
-- Name: reading_progress PK_2360621825d1001b80d94996cbb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "PK_2360621825d1001b80d94996cbb" PRIMARY KEY (id);


--
-- TOC entry 5275 (class 2606 OID 30180)
-- Name: ai_chat_messages PK_68e330d1b2a3c5368bf6d2f67cb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT "PK_68e330d1b2a3c5368bf6d2f67cb" PRIMARY KEY (id);


--
-- TOC entry 5301 (class 2606 OID 43067)
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- TOC entry 5250 (class 2606 OID 30047)
-- Name: bookmarks PK_7f976ef6cecd37a53bd11685f32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY (id);


--
-- TOC entry 5242 (class 2606 OID 30005)
-- Name: book_chunks PK_83d270379fb5e1b5b7928fac6de; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_chunks
    ADD CONSTRAINT "PK_83d270379fb5e1b5b7928fac6de" PRIMARY KEY (id);


--
-- TOC entry 5254 (class 2606 OID 30070)
-- Name: favorites PK_890818d27523748dd36a4d1bdc8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY (id);


--
-- TOC entry 5244 (class 2606 OID 30026)
-- Name: book_summaries PK_927de831ba63ef8f554fff2d22e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_summaries
    ADD CONSTRAINT "PK_927de831ba63ef8f554fff2d22e" PRIMARY KEY (id);


--
-- TOC entry 5298 (class 2606 OID 41930)
-- Name: quotes PK_99a0e8bcbcd8719d3a41f23c263; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY (id);


--
-- TOC entry 5231 (class 2606 OID 29956)
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- TOC entry 5279 (class 2606 OID 30220)
-- Name: ai_logs PK_ac5fbcd483f233f6d9a4cf0b49c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_logs
    ADD CONSTRAINT "PK_ac5fbcd483f233f6d9a4cf0b49c" PRIMARY KEY (id);


--
-- TOC entry 5272 (class 2606 OID 30159)
-- Name: ai_chat_sessions PK_b4f4844c31ab277de498502d1cd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT "PK_b4f4844c31ab277de498502d1cd" PRIMARY KEY (id);


--
-- TOC entry 5294 (class 2606 OID 41076)
-- Name: highlights PK_d1c0c3c4b7c722041ea0c626411; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.highlights
    ADD CONSTRAINT "PK_d1c0c3c4b7c722041ea0c626411" PRIMARY KEY (id);


--
-- TOC entry 5239 (class 2606 OID 29987)
-- Name: books PK_f3f2f25a099d24e12545b70b022; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY (id);


--
-- TOC entry 5246 (class 2606 OID 30028)
-- Name: book_summaries UQ_19f1e5656960509782297ee508e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_summaries
    ADD CONSTRAINT "UQ_19f1e5656960509782297ee508e" UNIQUE ("bookId");


--
-- TOC entry 5268 (class 2606 OID 30134)
-- Name: reviews UQ_38c643cf9c0ea57b5fbcba22982; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "UQ_38c643cf9c0ea57b5fbcba22982" UNIQUE ("userId", "bookId");


--
-- TOC entry 5256 (class 2606 OID 30072)
-- Name: favorites UQ_49fa2472467414ae956d9c11874; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "UQ_49fa2472467414ae956d9c11874" UNIQUE ("userId", "bookId");


--
-- TOC entry 5233 (class 2606 OID 29958)
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- TOC entry 5262 (class 2606 OID 30104)
-- Name: reading_progress UQ_ab73e1dfb9c45436d58f7ee0d2c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "UQ_ab73e1dfb9c45436d58f7ee0d2c" UNIQUE ("userId", "bookId");


--
-- TOC entry 5290 (class 2606 OID 38285)
-- Name: collections UQ_d4611adbef060750cee1a31d174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT "UQ_d4611adbef060750cee1a31d174" UNIQUE ("userId", name);


--
-- TOC entry 5285 (class 2606 OID 38264)
-- Name: collection_books UQ_fd82b1971c83c16acf589c1b22c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT "UQ_fd82b1971c83c16acf589c1b22c" UNIQUE ("collectionId", "bookId");


--
-- TOC entry 5295 (class 1259 OID 41932)
-- Name: IDX_062e9025bc7cb37ba61fd352ec; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_062e9025bc7cb37ba61fd352ec" ON public.quotes USING btree ("bookId");


--
-- TOC entry 5234 (class 1259 OID 29991)
-- Name: IDX_13cafaac4dd44a79a076c13050; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_13cafaac4dd44a79a076c13050" ON public.books USING btree ("searchVector");


--
-- TOC entry 5276 (class 1259 OID 30222)
-- Name: IDX_2abdf6ff88819ce1080df12f4a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2abdf6ff88819ce1080df12f4a" ON public.ai_logs USING btree (action);


--
-- TOC entry 5247 (class 1259 OID 30049)
-- Name: IDX_2c733d2b9f99ec2b765e3799f3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2c733d2b9f99ec2b765e3799f3" ON public.bookmarks USING btree ("bookId");


--
-- TOC entry 5269 (class 1259 OID 30160)
-- Name: IDX_2d02a651fbefaa506d31dba328; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2d02a651fbefaa506d31dba328" ON public.ai_chat_sessions USING btree ("userId");


--
-- TOC entry 5235 (class 1259 OID 29988)
-- Name: IDX_3cd818eaf734a9d8814843f119; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_3cd818eaf734a9d8814843f119" ON public.books USING btree (title);


--
-- TOC entry 5280 (class 1259 OID 38266)
-- Name: IDX_413c5e0ea50d153ec776f8954a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_413c5e0ea50d153ec776f8954a" ON public.collection_books USING btree ("bookId");


--
-- TOC entry 5291 (class 1259 OID 41078)
-- Name: IDX_44f9b1f741119a08caebdea8b3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_44f9b1f741119a08caebdea8b3" ON public.highlights USING btree ("bookId");


--
-- TOC entry 5236 (class 1259 OID 29989)
-- Name: IDX_4675aad2c57a7a793d26afbae9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_4675aad2c57a7a793d26afbae9" ON public.books USING btree (author);


--
-- TOC entry 5251 (class 1259 OID 30074)
-- Name: IDX_5de72faa7fa33dcf03c769238d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_5de72faa7fa33dcf03c769238d" ON public.favorites USING btree ("bookId");


--
-- TOC entry 5299 (class 1259 OID 43068)
-- Name: IDX_692a909ee0fa9383e7859f9b40; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON public.notifications USING btree ("userId");


--
-- TOC entry 5237 (class 1259 OID 29990)
-- Name: IDX_6f50357a540439c8d17050c830; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_6f50357a540439c8d17050c830" ON public.books USING btree (genre);


--
-- TOC entry 5263 (class 1259 OID 30135)
-- Name: IDX_7ed5659e7139fc8bc039198cc1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_7ed5659e7139fc8bc039198cc1" ON public.reviews USING btree ("userId");


--
-- TOC entry 5257 (class 1259 OID 30105)
-- Name: IDX_852b07cc623a0b04f6d44edf09; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_852b07cc623a0b04f6d44edf09" ON public.reading_progress USING btree ("userId");


--
-- TOC entry 5296 (class 1259 OID 41931)
-- Name: IDX_8bad8bd49d1dd6954b46366349; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8bad8bd49d1dd6954b46366349" ON public.quotes USING btree ("userId");


--
-- TOC entry 5273 (class 1259 OID 30181)
-- Name: IDX_c21b53eccf0eb35723bb10f549; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c21b53eccf0eb35723bb10f549" ON public.ai_chat_messages USING btree ("sessionId");


--
-- TOC entry 5248 (class 1259 OID 30048)
-- Name: IDX_c6065536f2f6de3a0163e19a58; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c6065536f2f6de3a0163e19a58" ON public.bookmarks USING btree ("userId");


--
-- TOC entry 5281 (class 1259 OID 38265)
-- Name: IDX_c9268e904b853256cffc2f9d02; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c9268e904b853256cffc2f9d02" ON public.collection_books USING btree ("collectionId");


--
-- TOC entry 5264 (class 1259 OID 30136)
-- Name: IDX_cab4e55252a9c18a27e8141529; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cab4e55252a9c18a27e8141529" ON public.reviews USING btree ("bookId");


--
-- TOC entry 5258 (class 1259 OID 30106)
-- Name: IDX_d25f92c683f1db870b69cb1c70; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d25f92c683f1db870b69cb1c70" ON public.reading_progress USING btree ("bookId");


--
-- TOC entry 5277 (class 1259 OID 30221)
-- Name: IDX_d3087a9b4b359a61a05a0f2773; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d3087a9b4b359a61a05a0f2773" ON public.ai_logs USING btree ("userId");


--
-- TOC entry 5286 (class 1259 OID 38286)
-- Name: IDX_da613d6625365707f8df0f65d8; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_da613d6625365707f8df0f65d8" ON public.collections USING btree ("userId");


--
-- TOC entry 5240 (class 1259 OID 30006)
-- Name: IDX_de0e72e7b878a6ccbdb8db6ff8; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_de0e72e7b878a6ccbdb8db6ff8" ON public.book_chunks USING btree ("bookId");


--
-- TOC entry 5252 (class 1259 OID 30073)
-- Name: IDX_e747534006c6e3c2f09939da60; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e747534006c6e3c2f09939da60" ON public.favorites USING btree ("userId");


--
-- TOC entry 5292 (class 1259 OID 41077)
-- Name: IDX_e8b7633ae3a022195305770473; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e8b7633ae3a022195305770473" ON public.highlights USING btree ("userId");


--
-- TOC entry 5270 (class 1259 OID 30161)
-- Name: IDX_f5d31d246221fef59612c9a366; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f5d31d246221fef59612c9a366" ON public.ai_chat_sessions USING btree ("bookId");


--
-- TOC entry 5325 (class 2620 OID 30317)
-- Name: books books_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER books_search_vector_trigger BEFORE INSERT OR UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.books_search_vector_update();


--
-- TOC entry 5322 (class 2606 OID 41938)
-- Name: quotes FK_062e9025bc7cb37ba61fd352ece; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT "FK_062e9025bc7cb37ba61fd352ece" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5303 (class 2606 OID 30029)
-- Name: book_summaries FK_19f1e5656960509782297ee508e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_summaries
    ADD CONSTRAINT "FK_19f1e5656960509782297ee508e" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5304 (class 2606 OID 30055)
-- Name: bookmarks FK_2c733d2b9f99ec2b765e3799f3d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT "FK_2c733d2b9f99ec2b765e3799f3d" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5312 (class 2606 OID 30182)
-- Name: ai_chat_sessions FK_2d02a651fbefaa506d31dba328f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT "FK_2d02a651fbefaa506d31dba328f" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5317 (class 2606 OID 38292)
-- Name: collection_books FK_413c5e0ea50d153ec776f8954a2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT "FK_413c5e0ea50d153ec776f8954a2" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5320 (class 2606 OID 41084)
-- Name: highlights FK_44f9b1f741119a08caebdea8b3d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.highlights
    ADD CONSTRAINT "FK_44f9b1f741119a08caebdea8b3d" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5306 (class 2606 OID 30080)
-- Name: favorites FK_5de72faa7fa33dcf03c769238dd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "FK_5de72faa7fa33dcf03c769238dd" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5324 (class 2606 OID 43069)
-- Name: notifications FK_692a909ee0fa9383e7859f9b406; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5310 (class 2606 OID 30137)
-- Name: reviews FK_7ed5659e7139fc8bc039198cc1f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5308 (class 2606 OID 30107)
-- Name: reading_progress FK_852b07cc623a0b04f6d44edf092; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "FK_852b07cc623a0b04f6d44edf092" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5323 (class 2606 OID 41933)
-- Name: quotes FK_8bad8bd49d1dd6954b46366349c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT "FK_8bad8bd49d1dd6954b46366349c" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5314 (class 2606 OID 30192)
-- Name: ai_chat_messages FK_c21b53eccf0eb35723bb10f549e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT "FK_c21b53eccf0eb35723bb10f549e" FOREIGN KEY ("sessionId") REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5315 (class 2606 OID 30228)
-- Name: ai_logs FK_c4fdb19351124fb07afefe94283; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_logs
    ADD CONSTRAINT "FK_c4fdb19351124fb07afefe94283" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE SET NULL;


--
-- TOC entry 5305 (class 2606 OID 30050)
-- Name: bookmarks FK_c6065536f2f6de3a0163e19a584; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT "FK_c6065536f2f6de3a0163e19a584" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5318 (class 2606 OID 38287)
-- Name: collection_books FK_c9268e904b853256cffc2f9d028; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT "FK_c9268e904b853256cffc2f9d028" FOREIGN KEY ("collectionId") REFERENCES public.collections(id) ON DELETE CASCADE;


--
-- TOC entry 5311 (class 2606 OID 30142)
-- Name: reviews FK_cab4e55252a9c18a27e81415299; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_cab4e55252a9c18a27e81415299" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5309 (class 2606 OID 30112)
-- Name: reading_progress FK_d25f92c683f1db870b69cb1c709; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "FK_d25f92c683f1db870b69cb1c709" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5316 (class 2606 OID 30223)
-- Name: ai_logs FK_d3087a9b4b359a61a05a0f2773c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_logs
    ADD CONSTRAINT "FK_d3087a9b4b359a61a05a0f2773c" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5319 (class 2606 OID 38297)
-- Name: collections FK_da613d6625365707f8df0f65d81; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT "FK_da613d6625365707f8df0f65d81" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5302 (class 2606 OID 30007)
-- Name: book_chunks FK_de0e72e7b878a6ccbdb8db6ff89; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_chunks
    ADD CONSTRAINT "FK_de0e72e7b878a6ccbdb8db6ff89" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 5307 (class 2606 OID 30075)
-- Name: favorites FK_e747534006c6e3c2f09939da60f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "FK_e747534006c6e3c2f09939da60f" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5321 (class 2606 OID 41079)
-- Name: highlights FK_e8b7633ae3a0221953057704733; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.highlights
    ADD CONSTRAINT "FK_e8b7633ae3a0221953057704733" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5313 (class 2606 OID 30187)
-- Name: ai_chat_sessions FK_f5d31d246221fef59612c9a366f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT "FK_f5d31d246221fef59612c9a366f" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON DELETE CASCADE;


-- Completed on 2026-04-14 02:13:02

--
-- PostgreSQL database dump complete
--

\unrestrict yh1iHDwXarTg1pLUjJ6Y9txBNFdecbkVeLWadgnAgtey9xaLy6YcuLBKgdOhE8h

