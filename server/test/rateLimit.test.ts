import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../src/rateLimit.js';
import { buildApp } from '../src/app.js';
import { createMockUpstream } from '../src/mockUpstream.js';
import { testConfig } from './helpers.js';

describe('createRateLimiter', () => {
  it('allows up to the limit per key within the window', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.hit('a')).toBe(true);
    expect(rl.hit('a')).toBe(true);
    expect(rl.hit('a')).toBe(false);
    expect(rl.hit('b')).toBe(true);
    t = 1001;
    expect(rl.hit('a')).toBe(true);
  });

  it('is disabled when limit is 0', () => {
    const rl = createRateLimiter({ limit: 0, windowMs: 1000 });
    for (let i = 0; i < 100; i++) expect(rl.hit('a')).toBe(true);
  });
});

describe('POST /api/chat rate limit', () => {
  it('returns 429 after the per-ip limit', async () => {
    const app = buildApp({ config: { ...testConfig, rateLimitPerHour: 1 }, upstream: createMockUpstream({ delayMs: 0 }) });
    const payload = { model: 'openai/gpt-5-mini', question: 'hi', history: [] };
    expect((await app.inject({ method: 'POST', url: '/api/chat', payload })).statusCode).toBe(200);
    const res = await app.inject({ method: 'POST', url: '/api/chat', payload });
    expect(res.statusCode).toBe(429);
    expect(res.json().error).toBe('Слишком много запросов. Попробуйте позже.');
  });
});
