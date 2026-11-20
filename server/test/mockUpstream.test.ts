import { describe, expect, it } from 'vitest';
import { createMockUpstream } from '../src/mockUpstream.js';
import type { UpstreamEvent } from '../src/types.js';

async function collect(it: AsyncIterable<UpstreamEvent>, stopAfter?: (e: UpstreamEvent) => boolean) {
  const out: UpstreamEvent[] = [];
  for await (const e of it) { out.push(e); if (stopAfter?.(e)) break; }
  return out;
}

describe('mock upstream', () => {
  const up = createMockUpstream({ delayMs: 0 });

  it('streams start, text and finish', async () => {
    const events = await collect(up.stream('openai/gpt-5-mini', 'hi', new AbortController().signal));
    expect(events[0].type).toBe('start');
    expect(events.at(-1)!.type).toBe('finish');
    expect(events.some((e) => e.type === 'text-delta')).toBe(true);
    expect(events.some((e) => e.type === 'reasoning-delta')).toBe(false);
  });

  it('emits reasoning for claude models', async () => {
    const events = await collect(up.stream('anthropic/claude-haiku-5.5', 'hi', new AbortController().signal));
    expect(events.some((e) => e.type === 'reasoning-delta')).toBe(true);
  });

  it('fails the second mock model when prompt contains #fail', async () => {
    const models = await up.listModels();
    const events = await collect(up.stream(models[1].id, 'x #fail', new AbortController().signal));
    expect(events.at(-1)).toEqual({ type: 'error', message: 'Mock failure' });
  });

  it('stops when aborted', async () => {
    const ctrl = new AbortController();
    const events: UpstreamEvent[] = [];
    for await (const e of up.stream('openai/gpt-5-mini', 'hi', ctrl.signal)) {
      events.push(e);
      ctrl.abort();
    }
    expect(events.some((e) => e.type === 'finish')).toBe(false);
  });
});
