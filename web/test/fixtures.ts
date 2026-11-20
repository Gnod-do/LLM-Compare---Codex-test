import type { ModelInfo, Metrics } from '../src/types';
import type { Answer } from '../src/state/reducer';

export const models: ModelInfo[] = [
  { id: 'anthropic/claude-haiku-5.5', name: 'Claude Haiku 5.5', provider: 'Anthropic', pricing: { input: 0.1, output: 0.5 } },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 mini', provider: 'OpenAI', pricing: { input: 0.25, output: 2 } },
  { id: 'google/gemini-4-argon', name: 'Gemini 4 Argon', provider: 'Google', pricing: { input: 2, output: 10 } },
  { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek', pricing: { input: 0.13, output: 0.26 } },
];

export const metrics = (over: Partial<Metrics> = {}): Metrics => ({
  ttftMs: 400, totalMs: 2100, reasoningMs: null, inputTokens: 120, outputTokens: 840, costUsd: 0.0021, ...over,
});

export const answer = (over: Partial<Answer> = {}): Answer => ({
  status: 'waiting', reasoning: '', text: '', metrics: null, error: null, startedAt: 0, ...over,
});
