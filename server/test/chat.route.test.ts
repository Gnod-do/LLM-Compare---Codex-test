import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { createMockUpstream } from '../src/mockUpstream.js';
import type { UpstreamEvent } from '../src/types.js';
import { fakeUpstream, sampleModel, testConfig } from './helpers.js';

let app: FastifyInstance | undefined;
afterEach(async () => {
  // fetch() keeps a pooled keep-alive socket open; drop it so close() does not wait on it
  app?.server.closeAllConnections();
  await app?.close();
  app = undefined;
});

const body = (over: object = {}) => ({ model: sampleModel.id, question: 'hi', history: [], ...over });

describe('POST /api/chat', () => {
  it('streams ndjson ending with done', async () => {
    app = buildApp({ config: testConfig, upstream: createMockUpstream({ delayMs: 0 }) });
    const res = await app.inject({ method: 'POST', url: '/api/chat', payload: body() });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/x-ndjson');
    const lines = res.body.trim().split('\n').map((l) => JSON.parse(l));
    expect(lines.some((l) => l.type === 'text')).toBe(true);
    expect(lines.at(-1).type).toBe('done');
  });

  it('passes history into the upstream prompt', async () => {
    let seen = '';
    app = buildApp({
      config: testConfig,
      upstream: fakeUpstream({
        stream: async function* (_m, prompt) { seen = prompt; yield { type: 'finish', usage: {} } as UpstreamEvent; },
      }),
    });
    await app.inject({ method: 'POST', url: '/api/chat', payload: body({ history: [{ question: 'q1', answer: 'a1' }], question: 'q2' }) });
    expect(seen).toContain('Ассистент: a1');
    expect(seen.endsWith('Пользователь: q2')).toBe(true);
  });

  it('rejects empty question', async () => {
    app = buildApp({ config: testConfig, upstream: fakeUpstream() });
    const res = await app.inject({ method: 'POST', url: '/api/chat', payload: body({ question: '   ' }) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects too long question', async () => {
    app = buildApp({ config: testConfig, upstream: fakeUpstream() });
    const res = await app.inject({ method: 'POST', url: '/api/chat', payload: body({ question: 'x'.repeat(4001) }) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects unknown model', async () => {
    app = buildApp({ config: testConfig, upstream: fakeUpstream() });
    const res = await app.inject({ method: 'POST', url: '/api/chat', payload: body({ model: 'nope/x' }) });
    expect(res.statusCode).toBe(400);
  });

  it('aborts upstream when client disconnects', async () => {
    let upstreamSignal: AbortSignal | undefined;
    app = buildApp({
      config: testConfig,
      upstream: fakeUpstream({
        stream: async function* (_m, _p, signal) {
          upstreamSignal = signal;
          while (!signal.aborted) {
            yield { type: 'text-delta', delta: 'x' } as UpstreamEvent;
            await new Promise((r) => setTimeout(r, 20));
          }
        },
      }),
    });
    const url = await app.listen({ port: 0, host: '127.0.0.1' });
    const ctrl = new AbortController();
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body()), signal: ctrl.signal,
    });
    const reader = res.body!.getReader();
    await reader.read();
    ctrl.abort();
    await new Promise((r) => setTimeout(r, 150));
    expect(upstreamSignal?.aborted).toBe(true);
  });
});
