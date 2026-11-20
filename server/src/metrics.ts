import type { Pricing } from './types.js';

/** USD cost from token counts and per-million-token pricing; null when the provider omitted a count. */
export function costUsd(pricing: Pricing, input: number | null, output: number | null): number | null {
  if (input == null || output == null) return null;
  return (input * pricing.input + output * pricing.output) / 1e6;
}
