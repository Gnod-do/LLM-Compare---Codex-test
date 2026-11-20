type Options = { limit: number; windowMs: number; now?: () => number };

/**
 * Fixed-window counter per key (client IP). limit 0 disables it.
 * In-memory: on serverless each warm instance counts separately, so this caps abuse, not exact usage.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: Options) {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    hit(key: string): boolean {
      if (limit <= 0) return true;
      const t = now();
      if (windows.size > 10_000) {
        for (const [k, w] of windows) if (t - w.start >= windowMs) windows.delete(k);
      }
      const w = windows.get(key);
      if (!w || t - w.start >= windowMs) {
        windows.set(key, { start: t, count: 1 });
        return true;
      }
      if (w.count >= limit) return false;
      w.count++;
      return true;
    },
  };
}
