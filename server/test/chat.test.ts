import { describe, expect, it } from 'vitest';
import { runChat } from '../src/chat.js';
import { UpstreamHttpError } from '../src/upstream.js';
import type { ChatEvent, UpstreamEvent } from '../src/types.js';
import { fakeUpstream, sampleModel } from './helpers.js';

function clock(times: number[]) {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)];
}
async function run(events: UpstreamEvent[] | (() => AsyncIterable<UpstreamEvent>), extra: Partial<Parameters<typeof runChat>[0]> = {}) {
  const upstream = fakeUpstream({
    stream: typeof events === 'function' ? events : async function* () { yield* events; },
  });
  const out: ChatEvent[] = [];
  for await (const e of runChat({ upstream, model: sampleModel, prompt: 'p', signal: new AbortController().signal, idleTimeoutMs: 1000, ...extra })) out.push(e);
  return out;
}

describe('runChat', () => {
  it('maps events and computes metrics', async () => {
    // now(): start=0, reasoning-start=100, first delta=200, reasoning-end=1200, text delta=1300, finish=2100
    const out = await run([
      { type: 'start' },
      { type: 'reasoning-start' },
      { type: 'reasoning-delta', delta: 'hmm' },
      { type: 'reasoning-end' },
      { type: 'text-delta', delta: 'Hi' },
      { type: 'finish', usage: { inputTokens: 1000, outputTokens: 2000 } },
    ], { now: clock([0, 0, 100, 200, 1200, 1300, 2100]) });
    expect(out.slice(0, 2)).toEqual([{ type: 'reasoning', delta: 'hmm' }, { type: 'text', delta: 'Hi' }]);
    expect(out[2]).toEqual({
      type: 'done',
      metrics: { ttftMs: 200, totalMs: 2100, reasoningMs: 1100, inputTokens: 1000, outputTokens: 2000, costUsd: (1000 * 0.25 + 2000 * 2) / 1e6 },
    });
  });

  it('emits error when upstream ends without finish', async () => {
    const out = await run([{ type: 'start' }, { type: 'text-delta', delta: 'x' }]);
    expect(out.at(-1)).toEqual({ type: 'error', error: { code: 'upstream', message: 'Ответ оборвался' } });
  });

  it('maps upstream error event', async () => {
    const out = await run([{ type: 'start' }, { type: 'error', message: 'boom' }]);
    expect(out).toEqual([{ type: 'error', error: { code: 'upstream', message: 'boom' } }]);
  });

  it('maps 429 to rate_limit', async () => {
    const out = await run(async function* () { throw new UpstreamHttpError(429, 'limit exceeded'); });
    expect(out).toEqual([{ type: 'error', error: { code: 'rate_limit', message: 'Лимит запросов исчерпан' } }]);
  });

  it('maps 403 to auth', async () => {
    const out = await run(async function* () { throw new UpstreamHttpError(403, 'Invalid API key'); });
    expect(out[0]).toMatchObject({ type: 'error', error: { code: 'auth' } });
  });

  it('times out after idle period', async () => {
    let upstreamSignal: AbortSignal | undefined;
    const out = await run(
      (async function* (_m: string, _p: string, signal: AbortSignal) {
        upstreamSignal = signal;
        yield { type: 'start' } as UpstreamEvent;
        await new Promise((r) => setTimeout(r, 10_000));
      }) as never,
      { idleTimeoutMs: 50 },
    );
    expect(out).toEqual([{ type: 'error', error: { code: 'timeout', message: 'Модель не ответила за 60 секунд' } }]);
    expect(upstreamSignal?.aborted).toBe(true);
  });

  it('ends silently when the client aborts', async () => {
    const ctrl = new AbortController();
    const upstream = fakeUpstream({
      stream: async function* () {
        yield { type: 'text-delta', delta: 'a' } as UpstreamEvent;
        ctrl.abort();
        yield { type: 'text-delta', delta: 'b' } as UpstreamEvent;
      },
    });
    const out: ChatEvent[] = [];
    for await (const e of runChat({ upstream, model: sampleModel, prompt: 'p', signal: ctrl.signal, idleTimeoutMs: 1000 })) out.push(e);
    expect(out).toEqual([{ type: 'text', delta: 'a' }]);
  });

  it('treats malformed upstream events as an upstream error', async () => {
    const out = await run([{ type: 'start' }, null as unknown as UpstreamEvent]);
    expect(out).toEqual([{ type: 'error', error: { code: 'upstream', message: 'Некорректный ответ модели' } }]);
  });

  it('ignores delta events without a string delta', async () => {
    const out = await run([{ type: 'text-delta' } as unknown as UpstreamEvent, { type: 'text-delta', delta: 'ok' }, { type: 'finish', usage: {} }]);
    expect(out.filter((e) => e.type === 'text')).toEqual([{ type: 'text', delta: 'ok' }]);
  });
});
