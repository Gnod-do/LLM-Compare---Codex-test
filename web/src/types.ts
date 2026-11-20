// Copy of server/src/types.ts — the API contract (spec §5). Keep both in sync.
export type Pricing = { input: number; output: number };
export type ModelInfo = { id: string; name: string; provider: string; pricing: Pricing };
export type HistoryItem = { question: string; answer: string };

export type Usage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
};

export type UpstreamEvent =
  | { type: 'reasoning-delta' | 'text-delta'; delta: string }
  | { type: 'start' | 'reasoning-start' | 'reasoning-end' | 'text-start' | 'text-end' }
  | { type: 'finish'; usage: Usage }
  | { type: 'error'; message: string };

export type ErrorCode = 'timeout' | 'rate_limit' | 'auth' | 'bad_request' | 'upstream';

export type Metrics = {
  ttftMs: number | null;
  totalMs: number;
  reasoningMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
};

export type ChatEvent =
  | { type: 'reasoning'; delta: string }
  | { type: 'text'; delta: string }
  | { type: 'done'; metrics: Metrics }
  | { type: 'error'; error: { code: ErrorCode; message: string } };
