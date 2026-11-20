import type { Metrics } from '../types';
import type { State } from '../state/reducer';

type Payload = {
  v: 1;
  c: string[];
  t: { q: string; a: Record<string, { x: string; r?: string; m: Metrics | null }> }[];
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes); c.close(); } });
  const out = source.pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Serializes finished answers into a compact url-safe string (gzip + base64url) for a #s= link. */
export async function encodeShare(state: State): Promise<string> {
  const payload: Payload = {
    v: 1,
    c: state.columns,
    t: state.turns.map((turn) => ({
      q: turn.question,
      a: Object.fromEntries(
        Object.entries(turn.answers)
          .filter(([, a]) => a.status === 'done')
          .map(([id, a]) => [id, { x: a.text, ...(a.reasoning ? { r: a.reasoning } : {}), m: a.metrics }]),
      ),
    })),
  };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(await pipe(json, new CompressionStream('gzip')));
}

export async function decodeShare(data: string): Promise<State | null> {
  try {
    const json = new TextDecoder().decode(await pipe(fromBase64Url(data), new DecompressionStream('gzip')));
    const p = JSON.parse(json) as Payload;
    if (p.v !== 1 || !Array.isArray(p.c) || !Array.isArray(p.t)) return null;
    return {
      columns: p.c.map(String),
      turns: p.t.map((turn, i) => ({
        id: `s${i + 1}`,
        question: String(turn.q),
        answers: Object.fromEntries(
          Object.entries(turn.a ?? {}).map(([id, a]) => [
            id,
            { status: 'done' as const, text: String(a.x ?? ''), reasoning: String(a.r ?? ''), metrics: a.m ?? null, error: null, startedAt: 0 },
          ]),
        ),
      })),
    };
  } catch {
    return null;
  }
}
