import { describe, expect, it } from 'vitest';
import { providerFromId } from '../src/providers.js';

describe('providerFromId', () => {
  it('maps known prefixes', () => {
    expect(providerFromId('anthropic/claude-haiku-5.5')).toBe('Anthropic');
    expect(providerFromId('openai/gpt-5-mini')).toBe('OpenAI');
    expect(providerFromId('spacexai/grok-4.7')).toBe('xAI');
    expect(providerFromId('moonshotai/kimi-k3')).toBe('Moonshot AI');
  });
  it('falls back to raw prefix', () => {
    expect(providerFromId('foo/bar')).toBe('foo');
  });
});
