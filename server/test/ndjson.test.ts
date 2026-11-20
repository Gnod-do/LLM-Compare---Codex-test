import { describe, expect, it } from 'vitest';
import { parseNdjson } from '../src/ndjson.js';

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(c) { for (const ch of chunks) c.enqueue(ch); c.close(); },
  });
}
async function collect<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of it) out.push(x);
  return out;
}

describe('parseNdjson', () => {
  it('parses lines split across chunks', async () => {
    const bytes = new TextEncoder().encode('{"type":"text-delta","delta":"Привет"}\n{"type":"finish"}');
    // byte 37 falls inside a 2-byte Cyrillic character
    const chunks = [bytes.slice(0, 10), bytes.slice(10, 37), bytes.slice(37)];
    expect(await collect(parseNdjson(streamOf(chunks)))).toEqual([
      { type: 'text-delta', delta: 'Привет' },
      { type: 'finish' },
    ]);
  });

  it('skips blank lines', async () => {
    const bytes = new TextEncoder().encode('\n\n{"a":1}\n\n');
    expect(await collect(parseNdjson(streamOf([bytes])))).toEqual([{ a: 1 }]);
  });
});
