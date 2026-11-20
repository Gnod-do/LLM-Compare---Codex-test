import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('applies defaults in mock mode', () => {
    expect(loadConfig({ MOCK_LLM: '1' })).toEqual({
      apiUrl: 'http://llm.codex.so', apiKey: '', mock: true, port: 3001, idleTimeoutMs: 60000, rateLimitPerHour: 0,
    });
  });
  it('requires a key when not mocking', () => {
    expect(() => loadConfig({ MOCK_LLM: '0' })).toThrow(/LLM_API_KEY/);
  });
  it('reads env values', () => {
    const c = loadConfig({ MOCK_LLM: '0', LLM_API_KEY: 'x', PORT: '4000', IDLE_TIMEOUT_MS: '2000', LLM_API_URL: 'http://a.b/', RATE_LIMIT_PER_HOUR: '30' });
    expect(c).toEqual({ apiUrl: 'http://a.b', apiKey: 'x', mock: false, port: 4000, idleTimeoutMs: 2000, rateLimitPerHour: 30 });
  });
});
