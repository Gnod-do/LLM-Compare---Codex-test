import type { Config } from './config.js';
import { parseNdjson } from './ndjson.js';
import { providerFromId } from './providers.js';
import type { ModelInfo, UpstreamEvent } from './types.js';

export interface Upstream {
  listModels(): Promise<ModelInfo[]>;
  stream(model: string, prompt: string, signal: AbortSignal): AsyncIterable<UpstreamEvent>;
}

export class UpstreamHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'UpstreamHttpError';
  }
}

type RawModel = { id: string; name: string; pricing: { input: number; output: number } };

export function createHttpUpstream(config: Config): Upstream {
  const headers = { 'x-api-key': config.apiKey };

  return {
    async listModels() {
      const res = await fetch(`${config.apiUrl}/models`, { headers });
      if (!res.ok) throw new UpstreamHttpError(res.status, await errorText(res));
      const data = (await res.json()) as { models: RawModel[] };
      return data.models.map((m) => ({
        id: m.id,
        name: m.name,
        provider: providerFromId(m.id),
        pricing: { input: m.pricing.input, output: m.pricing.output },
      }));
    },
    async *stream(model, prompt, signal) {
      const res = await fetch(`${config.apiUrl}/stream`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({ prompt, model }),
        signal,
      });
      if (!res.ok || !res.body) throw new UpstreamHttpError(res.status, await errorText(res));
      for await (const event of parseNdjson(res.body)) yield event as UpstreamEvent;
    },
  };
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
