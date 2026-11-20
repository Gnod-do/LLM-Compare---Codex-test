import type { Upstream } from '../src/upstream.js';
import type { ModelInfo, UpstreamEvent } from '../src/types.js';
import type { Config } from '../src/config.js';

export const testConfig: Config = {
  apiUrl: 'http://upstream.test', apiKey: 'k', mock: true, port: 0, idleTimeoutMs: 60000, rateLimitPerHour: 0,
};

export const sampleModel: ModelInfo = {
  id: 'openai/gpt-5-mini', name: 'GPT-5 mini', provider: 'OpenAI', pricing: { input: 0.25, output: 2 },
};

export function fakeUpstream(opts: {
  models?: ModelInfo[];
  stream?: (model: string, prompt: string, signal: AbortSignal) => AsyncIterable<UpstreamEvent>;
} = {}): Upstream & { listCalls: number } {
  const up = {
    listCalls: 0,
    async listModels() { up.listCalls++; return opts.models ?? [sampleModel]; },
    stream: opts.stream ?? (async function* () { /* empty */ }),
  };
  return up;
}
