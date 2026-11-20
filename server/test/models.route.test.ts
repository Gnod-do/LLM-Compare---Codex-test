import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakeUpstream, testConfig } from './helpers.js';

describe('GET /api/models', () => {
  it('returns models with provider and pricing', async () => {
    const app = buildApp({ config: testConfig, upstream: fakeUpstream() });
    const res = await app.inject({ method: 'GET', url: '/api/models' });
    expect(res.statusCode).toBe(200);
    expect(res.json().models[0]).toEqual({
      id: 'openai/gpt-5-mini', name: 'GPT-5 mini', provider: 'OpenAI', pricing: { input: 0.25, output: 2 },
    });
  });

  it('caches upstream model list', async () => {
    const upstream = fakeUpstream();
    const app = buildApp({ config: testConfig, upstream });
    await app.inject({ method: 'GET', url: '/api/models' });
    await app.inject({ method: 'GET', url: '/api/models' });
    expect(upstream.listCalls).toBe(1);
  });

  it('returns 502 when upstream fails', async () => {
    const upstream = fakeUpstream();
    upstream.listModels = async () => { throw new Error('down'); };
    const app = buildApp({ config: testConfig, upstream });
    const res = await app.inject({ method: 'GET', url: '/api/models' });
    expect(res.statusCode).toBe(502);
  });
});
