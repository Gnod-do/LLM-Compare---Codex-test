import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChat } from '../src/api/client';
import type { ChatEvent } from '../src/types';

function bodyOf(chunks: string[]) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({ start(c) { chunks.forEach((s) => c.enqueue(enc.encode(s))); c.close(); } });
}
const req = { model: 'm', question: 'q', history: [] };
afterEach(() => vi.unstubAllGlobals());

describe('streamChat', () => {
  it('emits parsed events across chunks', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(bodyOf(['{"type":"text","del', 'ta":"Hi"}\n{"type":"done","metrics":{"totalMs":1}}\n']), { status: 200 })));
    const events: ChatEvent[] = [];
    await streamChat(req, (e) => events.push(e), new AbortController().signal);
    expect(events.map((e) => e.type)).toEqual(['text', 'done']);
  });

  it('reports http errors as bad_request', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'bad model' }), { status: 400 })));
    const events: ChatEvent[] = [];
    await streamChat(req, (e) => events.push(e), new AbortController().signal);
    expect(events).toEqual([{ type: 'error', error: { code: 'bad_request', message: 'bad model' } }]);
  });

  it('reports network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const events: ChatEvent[] = [];
    await streamChat(req, (e) => events.push(e), new AbortController().signal);
    expect(events).toEqual([{ type: 'error', error: { code: 'upstream', message: 'Сервер недоступен' } }]);
  });

  it('is silent on abort', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('aborted', 'AbortError'); }));
    const events: ChatEvent[] = [];
    await streamChat(req, (e) => events.push(e), new AbortController().signal);
    expect(events).toEqual([]);
  });

  it('reports a stream that ends without done or error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(bodyOf(['{"type":"text","delta":"Hi"}\n']), { status: 200 })));
    const events: ChatEvent[] = [];
    await streamChat(req, (e) => events.push(e), new AbortController().signal);
    expect(events).toEqual([
      { type: 'text', delta: 'Hi' },
      { type: 'error', error: { code: 'upstream', message: 'Ответ оборвался' } },
    ]);
  });

  it('decodes utf-8 split inside a character', async () => {
    const bytes = new TextEncoder().encode('{"type":"text","delta":"Привет"}\n{"type":"done","metrics":{"totalMs":1}}\n');
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes.slice(0, 27)); c.enqueue(bytes.slice(27)); c.close(); } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })));
    const events: ChatEvent[] = [];
    await streamChat(req, (e) => events.push(e), new AbortController().signal);
    expect(events[0]).toEqual({ type: 'text', delta: 'Привет' });
  });
});
