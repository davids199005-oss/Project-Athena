/**
 * @module ai.service
 *
 * **Purpose:** Central integration with OpenAI for embeddings, RAG over `book_chunks`,
 * book summaries, and per-book chat sessions with optional streaming.
 *
 * **Responsibilities:** Generate/stored summaries; batch embeddings; vector search and semantic
 * recommendations; persist chat messages; reformulate short/coreferential user queries for retrieval;
 * append structured usage logs (`AiLog`) without failing the user-facing request when logging fails.
 *
 * **Integration notes:** Depends on PostgreSQL `pgvector` (`<=>` distance) and raw SQL for vector
 * ops TypeORM does not fully abstract. Streaming chat logs `tokensUsed: 0` because the streaming API
 * does not return usage in this path—metrics consumers should treat that as a known limitation.
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { BookChunk } from '../books/entities/book-chunk.entity';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage, ChatMessageRole } from './entities/ai-chat-message.entity';
import { AiLog, AiAction } from './entities/ai-log.entity';
import { buildBookChatSystemPrompt } from './prompts/book-chat.prompt';
import { buildBookSummaryPrompt } from './prompts/book-summary.prompt';
import { BookSummary } from '@/books/entities/book-summary.entity';

/**
 * OpenAI-backed retrieval and chat orchestrator.
 *
 * **Resource usage:** Chat paths may issue multiple model calls (reformulation + completion) and
 * several DB round-trips; streaming and non-streaming variants intentionally duplicate setup to
 * keep behavior aligned.
 */
@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(BookChunk)
    private readonly bookChunkRepository: Repository<BookChunk>,
    @InjectRepository(AiChatSession)
    private readonly sessionRepository: Repository<AiChatSession>,
    @InjectRepository(AiChatMessage)
    private readonly messageRepository: Repository<AiChatMessage>,
    @InjectRepository(AiLog)
    private readonly logRepository: Repository<AiLog>,
    @InjectRepository(BookSummary)
    private readonly summaryRepository: Repository<BookSummary>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }
// ═══════════════════════════════════════════
  // Book Summary
  // ═══════════════════════════════════════════

  /**
   * Generates a persisted book summary from a stratified sample of chunks (head + mid-book).
   *
   * **Trade-off:** Sampling limits token cost but may miss nuance in unsampled regions.
   * **Side effects:** Inserts `BookSummary` and consumes OpenAI tokens.
   */
  async generateSummary(
    bookId: string,
    bookTitle: string,
    bookAuthor: string,
    chunks: { content: string; chunkIndex: number }[],
  ): Promise<BookSummary> {
    // Sample: first 10 chunks + 5 from the middle
    const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
    const firstChunks = sorted.slice(0, 10);
    const midStart = Math.floor(sorted.length / 2);
    const midChunks = sorted.slice(midStart, midStart + 5);

    const textSample = [...firstChunks, ...midChunks]
      .map((c) => c.content)
      .join('\n\n---\n\n');

    const startTime = Date.now();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: buildBookSummaryPrompt(bookTitle, bookAuthor, textSample),
        },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });

    const summaryText = completion.choices[0].message.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;
    const durationMs = Date.now() - startTime;

    // Persist summary row
    const summary = this.summaryRepository.create({
      bookId,
      summary: summaryText,
      model: 'gpt-4o-mini',
      tokensUsed,
    });
    const savedSummary = await this.summaryRepository.save(summary);

    this.logger.log(
      `Generated summary for book ${bookId} (${tokensUsed} tokens, ${durationMs}ms)`,
    );

    return savedSummary;
  }
  // ═══════════════════════════════════════════
  // Embeddings
  // ═══════════════════════════════════════════

  /**
   * Creates embeddings for many inputs in one API call (order preserved via `index` sorting).
   *
   * **Failure mode:** Propagates OpenAI errors—callers should expect transient provider failures.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    this.logger.log(`Generating embeddings for ${texts.length} texts...`);

    try {
        
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float',
      });

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      this.logger.log(
        `Generated ${embeddings.length} embeddings, tokens used: ${response.usage.total_tokens}`,
      );

      return embeddings;

    } catch (error) {
      this.logger.error('Failed to generate embeddings', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.generateEmbeddings([text]);
    return embedding;
  }

  // ═══════════════════════════════════════════
  // RAG Search
  // ═══════════════════════════════════════════

  /**
   * Vector similarity search over chunk embeddings using cosine distance (`<=>`).
   *
   * **Parameters:** Embeds `query` first (extra latency/cost). Optional `bookId` scopes to one book.
   */
  async searchChunks(
    query: string,
    bookId?: string,
    limit: number = 5,
  ): Promise<{ id: string; bookId: string; chunkIndex: number; content: string; chapterTitle: string | null; distance: number }[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    let sql = `
      SELECT id, "bookId", "chunkIndex", content, "chapterTitle",
             embedding_vec <=> $1::vector(1536) AS distance
      FROM book_chunks
      WHERE embedding_vec IS NOT NULL
    `;

    const params: any[] = [JSON.stringify(queryEmbedding)];

    if (bookId) {
      sql += ` AND "bookId" = $2`;
      params.push(bookId);
    }

    sql += ` ORDER BY distance ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const results = await this.bookChunkRepository.query(sql, params);

    this.logger.log(
      `Search "${query.substring(0, 50)}..." returned ${results.length} chunks`,
    );

    return results;
  }

  // ═══════════════════════════════════════════
  // Recommendations
  // ═══════════════════════════════════════════

  /**
   * Recommends other books by comparing average chunk embeddings (book-level centroid similarity).
   *
   * **Limitation:** Returns empty when the source book has no embeddings; quality depends on chunk coverage.
   */
  async getRecommendations(
    bookId: string,
    limit: number = 5,
  ): Promise<{ id: string; title: string; author: string; genre: string; coverImageUrl: string | null; rating: number; similarity: number }[]> {
    // 1. Average chunk embeddings for this book
    const avgEmbedding = await this.bookChunkRepository.query(
      `SELECT AVG(embedding_vec)::text AS avg_vec
       FROM book_chunks
       WHERE "bookId" = $1 AND embedding_vec IS NOT NULL`,
      [bookId],
    );

    if (!avgEmbedding[0]?.avg_vec) {
      this.logger.warn(`No embeddings found for book ${bookId}`);
      return [];
    }

    // 2. Nearest books by centroid similarity
    const results = await this.bookChunkRepository.query(
      `WITH book_avg AS (
        SELECT "bookId", AVG(embedding_vec) AS avg_vec
        FROM book_chunks
        WHERE embedding_vec IS NOT NULL AND "bookId" != $1
        GROUP BY "bookId"
      )
      SELECT b.id, b.title, b.author, b.genre, b."coverImageUrl", b.rating,
             1 - (ba.avg_vec <=> $2::vector(1536)) AS similarity
      FROM book_avg ba
      JOIN books b ON b.id = ba."bookId"
      ORDER BY ba.avg_vec <=> $2::vector(1536) ASC
      LIMIT $3`,
      [bookId, avgEmbedding[0].avg_vec, limit],
    );

    this.logger.log(`Found ${results.length} recommendations for book ${bookId}`);
    return results;
  }

  // ═══════════════════════════════════════════
  // Chat Sessions
  // ═══════════════════════════════════════════

  async createSession(userId: string, bookId: string): Promise<AiChatSession> {
    const session = this.sessionRepository.create({ userId, bookId });
    return this.sessionRepository.save(session);
  }

  async getSessions(userId: string): Promise<AiChatSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      relations: ['book'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getMessages(sessionId: string, userId: string): Promise<AiChatMessage[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  // ═══════════════════════════════════════════
  // Query Reformulation
  // ═══════════════════════════════════════════

  private async reformulateQuery(
    currentMessage: string,
    recentHistory: { role: string; content: string }[],
  ): Promise<string> {
    if (recentHistory.length === 0) {
      return currentMessage;
    }

    if (currentMessage.length > 80 && !this.isReferentialQuery(currentMessage)) {
      return currentMessage;
    }

    const historyText = recentHistory
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a query reformulator. Given a conversation history and the user's latest message, rewrite the latest message as a standalone search query that captures the full intent.

Rules:
- Output ONLY the reformulated query, nothing else.
- Include specific names, topics, chapters, or concepts from the conversation that the user is referring to.
- If the latest message is already a clear standalone question, return it unchanged.
- Keep the query concise (under 200 characters).
- Do NOT answer the question — only reformulate it.`,
        },
        {
          role: 'user',
          content: `Conversation history:\n${historyText}\n\nLatest message: ${currentMessage}\n\nReformulated standalone query:`,
        },
      ],
      max_tokens: 100,
      temperature: 0.0,
    });

    return completion.choices[0].message.content?.trim() || currentMessage;
  }

  private isReferentialQuery(message: string): boolean {
    const referentialPatterns =
      /\b(that|this|it|those|these|there|here|above|previous|earlier|mentioned|the same|more about|what about|how about|explain|elaborate|continue|go on|этот|тот|там|тут|этих|тех|выше|ранее|предыдущ|упомянут|подробнее|расскажи ещё|продолж)\b/i;
    return referentialPatterns.test(message);
  }

  // ═══════════════════════════════════════════
  // Chat (RAG + GPT)
  // ═══════════════════════════════════════════

  /**
   * Non-streaming chat: saves user message, retrieves context, calls chat completion, saves assistant
   * message, and logs usage.
   *
   * **Side effects:** Multiple DB writes and OpenAI calls; updates session touch timestamp via
   * `update(sessionId, {})`. History window capped to limit prompt size.
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
  ): Promise<AiChatMessage> {
    // 1. Load session and enforce ownership
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 2. Persist user message
    const userMessage = this.messageRepository.create({
      sessionId,
      role: ChatMessageRole.USER,
      content,
    });
    await this.messageRepository.save(userMessage);

    // 3. Start timer (RAG + completion)
    const startTime = Date.now();

    // 4. Recent turns for query reformulation
    const recentMessages = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 7,
    });
    const recentHistory = recentMessages
      .reverse()
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }));

    // 5. Standalone search query for retrieval
    const searchQuery = await this.reformulateQuery(content, recentHistory);

    // 6. RAG: primary + optional supplementary chunk retrieval
    const primaryChunks = await this.searchChunks(searchQuery, session.bookId, 5);
    let allChunks = primaryChunks;

    if (searchQuery !== content && content.length > 15) {
      const supplementaryChunks = await this.searchChunks(content, session.bookId, 3);
      const chunkMap = new Map<string, (typeof primaryChunks)[0]>();
      for (const chunk of [...primaryChunks, ...supplementaryChunks]) {
        const existing = chunkMap.get(chunk.id);
        if (!existing || chunk.distance < existing.distance) {
          chunkMap.set(chunk.id, chunk);
        }
      }
      allChunks = Array.from(chunkMap.values())
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 7);
    }

    const context = allChunks
      .map((chunk) => {
        const header = chunk.chapterTitle ? `[${chunk.chapterTitle}]\n` : '';
        return `${header}${chunk.content}`;
      })
      .join('\n\n---\n\n');

    this.logger.log(
      `Session ${sessionId}: original="${content.substring(0, 80)}" → reformulated="${searchQuery.substring(0, 80)}" → ${allChunks.length} chunks`,
    );

    // 7. Bounded chat history window
    const MAX_HISTORY_MESSAGES = 20;
    const history = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: MAX_HISTORY_MESSAGES + 1,
    });
    history.reverse();

    // 8. Build OpenAI messages[]
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: buildBookChatSystemPrompt(context),
      },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // 9. Chat completion
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantContent = completion.choices[0].message.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // 10. End timer
    const durationMs = Date.now() - startTime;

    // 11. Persist assistant message
    const assistantMessage = this.messageRepository.create({
      sessionId,
      role: ChatMessageRole.ASSISTANT,
      content: assistantContent,
      tokensUsed,
    });
    await this.messageRepository.save(assistantMessage);

    // 12. Audit log row
    await this.logAiCall({
      userId,
      bookId: session.bookId,
      action: AiAction.CHAT,
      model: 'gpt-4o-mini',
      tokensUsed,
      durationMs,
    });

    // 13. Touch session updatedAt
    await this.sessionRepository.update(sessionId, {});

    this.logger.log(
      `Chat session ${sessionId}: GPT replied (${tokensUsed} tokens, ${durationMs}ms)`,
    );

    return assistantMessage;
  }

  // ═══════════════════════════════════════════
  // Streaming Chat (WebSocket)
  // ═══════════════════════════════════════════

  /**
   * Streaming variant of `sendMessage` with identical retrieval setup; emits deltas via `onChunk`.
   *
   * **Caveat:** Persists `tokensUsed: 0` for the assistant message because streaming responses do
   * not include usage metadata in this integration.
   */
  async sendMessageStream(
    sessionId: string,
    userId: string,
    content: string,
    onChunk: (chunk: string) => void,
  ): Promise<AiChatMessage> {
    // Steps 1–8 match sendMessage (context prep)
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');

    const userMessage = this.messageRepository.create({
      sessionId,
      role: ChatMessageRole.USER,
      content,
    });
    await this.messageRepository.save(userMessage);

    const startTime = Date.now();

    const recentMessages = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 7,
    });
    const recentHistory = recentMessages
      .reverse()
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }));

    const searchQuery = await this.reformulateQuery(content, recentHistory);

    const primaryChunks = await this.searchChunks(searchQuery, session.bookId, 5);
    let allChunks = primaryChunks;

    if (searchQuery !== content && content.length > 15) {
      const supplementaryChunks = await this.searchChunks(content, session.bookId, 3);
      const chunkMap = new Map<string, (typeof primaryChunks)[0]>();
      for (const chunk of [...primaryChunks, ...supplementaryChunks]) {
        const existing = chunkMap.get(chunk.id);
        if (!existing || chunk.distance < existing.distance) {
          chunkMap.set(chunk.id, chunk);
        }
      }
      allChunks = Array.from(chunkMap.values())
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 7);
    }

    const context = allChunks
      .map((chunk) => {
        const header = chunk.chapterTitle ? `[${chunk.chapterTitle}]\n` : '';
        return `${header}${chunk.content}`;
      })
      .join('\n\n---\n\n');

    const MAX_HISTORY_MESSAGES = 20;
    const history = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: MAX_HISTORY_MESSAGES + 1,
    });
    history.reverse();

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildBookChatSystemPrompt(context) },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // 9. Streaming completion
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }
    }

    const durationMs = Date.now() - startTime;

    // Persist full assistant text
    const assistantMessage = this.messageRepository.create({
      sessionId,
      role: ChatMessageRole.ASSISTANT,
      content: fullContent,
      tokensUsed: 0, // streaming API omits usage here
    });
    await this.messageRepository.save(assistantMessage);

    await this.logAiCall({
      userId,
      bookId: session.bookId,
      action: AiAction.CHAT,
      model: 'gpt-4o-mini',
      tokensUsed: 0,
      durationMs,
    });

    await this.sessionRepository.update(sessionId, {});

    this.logger.log(
      `Chat stream session ${sessionId}: GPT replied (${fullContent.length} chars, ${durationMs}ms)`,
    );

    return assistantMessage;
  }

  // ═══════════════════════════════════════════
  // Delete Session
  // ═══════════════════════════════════════════

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.sessionRepository.remove(session);
  }

  // ═══════════════════════════════════════════
  // AI logging (private)
  // ═══════════════════════════════════════════

  // Writes ai_logs; failures must not break the user-facing response path.
  private async logAiCall(params: {
    userId: string;
    bookId?: string | null;
    action: AiAction;
    model: string;
    tokensUsed: number;
    durationMs: number;
  }): Promise<void> {
    try {
      const log = this.logRepository.create({
        userId: params.userId,
        bookId: params.bookId || null,
        action: params.action,
        model: params.model,
        tokensUsed: params.tokensUsed,
        durationMs: params.durationMs,
      });
      await this.logRepository.save(log);
    } catch (error) {
      this.logger.error('Failed to save AI log', error);
    }
  }
}