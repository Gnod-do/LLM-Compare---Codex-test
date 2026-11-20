import type { Upstream } from './upstream.js';
import type { ModelInfo } from './types.js';

const TTL_MS = 10 * 60 * 1000;

export type ModelCatalog = { list(): Promise<ModelInfo[]> };

export function createCatalog(upstream: Upstream, now = () => Date.now()): ModelCatalog {
  let cached: { at: number; models: ModelInfo[] } | null = null;
  return {
    async list() {
      if (cached && now() - cached.at < TTL_MS) return cached.models;
      const models = await upstream.listModels();
      cached = { at: now(), models };
      return models;
    },
  };
}
