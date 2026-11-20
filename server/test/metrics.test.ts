import { describe, expect, it } from 'vitest';
import { costUsd } from '../src/metrics.js';

describe('costUsd', () => {
  it('computes price per million tokens', () => {
    expect(costUsd({ input: 0.1, output: 0.5 }, 1000, 2000)).toBeCloseTo(0.0011, 10);
  });
  it('returns null when tokens are unknown', () => {
    expect(costUsd({ input: 0.1, output: 0.5 }, null, 2000)).toBeNull();
    expect(costUsd({ input: 0.1, output: 0.5 }, 10, null)).toBeNull();
  });
});
