import { costUsd } from './metrics.js';
import { UpstreamHttpError, type Upstream } from './upstream.js';
import type { ChatEvent, ErrorCode, ModelInfo, UpstreamEvent } from './types.js';

export const TIMEOUT_MESSAGE = 'Модель не ответила за 60 секунд';

type Options = {
  upstream: Upstream;
  model: ModelInfo;
  prompt: string;
  signal: AbortSignal;
  idleTimeoutMs: number;
  now?: () => number;
};

const fail = (code: ErrorCode, message: string): ChatEvent => ({ type: 'error', error: { code, message } });

function mapError(err: unknown): ChatEvent {
  if (err instanceof UpstreamHttpError) {
    if (err.status === 429) return fail('rate_limit', 'Лимит запросов исчерпан');
    if (err.status === 401 || err.status === 403) return fail('auth', 'Неверный API-ключ на сервере');
    if (err.status === 400) return fail('bad_request', err.message || 'Некорректный запрос');
    return fail('upstream', `Ошибка модели (${err.status})`);
  }
  return fail('upstream', 'Не удалось связаться с моделью');
}

/**
 * Streams one model's answer as normalized ChatEvents and measures it.
 * Always ends with exactly one `done` or `error`, except when the client aborts (then it ends silently).
 */
export async function* runChat({ upstream, model, prompt, signal, idleTimeoutMs, now = Date.now }: Options): AsyncGenerator<ChatEvent> {
  if (signal.aborted) return;
  const ctrl = new AbortController();
  const clientAborted = new Promise<'aborted'>((resolve) => {
    signal.addEventListener('abort', () => { ctrl.abort(); resolve('aborted'); }, { once: true });
  });

  const t0 = now();
  let ttftMs: number | null = null;
  let reasoningStart: number | null = null;
  let reasoningMs: number | null = null;
  const it = upstream.stream(model.id, prompt, ctrl.signal)[Symbol.asyncIterator]();

  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const idle = new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), idleTimeoutMs); });
      const next = it.next();
      next.catch(() => {}); // a losing race must not surface as an unhandled rejection

      let step: IteratorResult<UpstreamEvent> | 'timeout' | 'aborted';
      try {
        step = await Promise.race([next, idle, clientAborted]);
      } catch (err) {
        if (signal.aborted) return;
        yield mapError(err);
        return;
      } finally {
        clearTimeout(timer);
      }

      if (step === 'aborted' || signal.aborted) return;
      if (step === 'timeout') {
        yield fail('timeout', TIMEOUT_MESSAGE);
        return;
      }
      if (step.done) {
        yield fail('upstream', 'Ответ оборвался');
        return;
      }

      const event = step.value as UpstreamEvent | null;
      if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
        yield fail('upstream', 'Некорректный ответ модели');
        return;
      }
      const t = now();
      switch (event.type) {
        case 'reasoning-start':
          reasoningStart = t;
          break;
        case 'reasoning-end':
          if (reasoningStart != null) reasoningMs = t - reasoningStart;
          break;
        case 'reasoning-delta':
        case 'text-delta':
          if (typeof event.delta !== 'string') break;
          if (ttftMs == null) ttftMs = t - t0;
          yield { type: event.type === 'text-delta' ? 'text' : 'reasoning', delta: event.delta };
          break;
        case 'error':
          yield fail('upstream', event.message || 'Ошибка модели');
          return;
        case 'finish': {
          const input = event.usage?.inputTokens ?? null;
          const output = event.usage?.outputTokens ?? null;
          yield {
            type: 'done',
            metrics: { ttftMs, totalMs: t - t0, reasoningMs, inputTokens: input, outputTokens: output, costUsd: costUsd(model.pricing, input, output) },
          };
          return;
        }
      }
    }
  } finally {
    ctrl.abort(); // stop the upstream request on timeout, error or client disconnect
    it.return?.(undefined)?.catch(() => {});
  }
}
