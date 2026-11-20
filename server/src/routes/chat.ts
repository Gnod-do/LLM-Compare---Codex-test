import type { FastifyInstance } from 'fastify';
import type { ModelCatalog } from '../catalog.js';
import type { Config } from '../config.js';
import type { Upstream } from '../upstream.js';
import type { HistoryItem } from '../types.js';
import { buildPrompt } from '../prompt.js';
import { runChat } from '../chat.js';
import { createRateLimiter } from '../rateLimit.js';

type Body = { model: string; question: string; history: HistoryItem[] };

const MAX_QUESTION = 4000;

const schema = {
  body: {
    type: 'object',
    required: ['model', 'question', 'history'],
    additionalProperties: false,
    properties: {
      model: { type: 'string', minLength: 1 },
      question: { type: 'string', maxLength: MAX_QUESTION },
      history: {
        type: 'array',
        maxItems: 20,
        items: {
          type: 'object',
          required: ['question', 'answer'],
          properties: { question: { type: 'string' }, answer: { type: 'string' } },
        },
      },
    },
  },
} as const;

export function registerChatRoute(app: FastifyInstance, deps: { config: Config; upstream: Upstream; catalog: ModelCatalog }) {
  const limiter = createRateLimiter({ limit: deps.config.rateLimitPerHour, windowMs: 60 * 60 * 1000 });
  app.post<{ Body: Body }>('/api/chat', { schema }, async (req, reply) => {
    const { model: modelId, history } = req.body;
    const question = req.body.question.trim();
    if (!question) return reply.status(400).send({ error: 'Вопрос не может быть пустым' });
    if (!limiter.hit(req.ip)) return reply.status(429).send({ error: 'Слишком много запросов. Попробуйте позже.' });

    let models;
    try {
      models = await deps.catalog.list();
    } catch {
      return reply.status(502).send({ error: 'Не удалось загрузить список моделей' });
    }
    const model = models.find((m) => m.id === modelId);
    if (!model) return reply.status(400).send({ error: `Неизвестная модель: ${modelId}` });

    const prompt = buildPrompt(history, question);
    const ctrl = new AbortController();
    reply.raw.on('close', () => {
      if (!reply.raw.writableEnded) ctrl.abort();
    });

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });

    let outcome = 'aborted';
    try {
      for await (const event of runChat({ upstream: deps.upstream, model, prompt, signal: ctrl.signal, idleTimeoutMs: deps.config.idleTimeoutMs })) {
        if (event.type === 'done') outcome = 'done';
        if (event.type === 'error') outcome = `error:${event.error.code}`;
        reply.raw.write(`${JSON.stringify(event)}\n`);
      }
    } catch (err) {
      // the reply is hijacked, so Fastify cannot answer for us: report and close the stream ourselves
      outcome = 'error:internal';
      req.log.error({ err }, 'chat stream failed');
      if (!reply.raw.destroyed) reply.raw.write(`${JSON.stringify({ type: 'error', error: { code: 'upstream', message: 'Внутренняя ошибка сервера' } })}\n`);
    } finally {
      req.log.info({ model: model.id, promptChars: prompt.length, historyTurns: history.length, outcome }, 'chat finished');
      reply.raw.end();
    }
  });
}
