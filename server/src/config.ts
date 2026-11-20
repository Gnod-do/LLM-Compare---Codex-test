export type Config = {
  apiUrl: string;
  apiKey: string;
  mock: boolean;
  port: number;
  idleTimeoutMs: number;
  /** max /api/chat requests per client IP per hour; 0 = unlimited */
  rateLimitPerHour: number;
};

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const mock = env.MOCK_LLM === '1';
  const apiKey = env.LLM_API_KEY ?? '';
  if (!mock && !apiKey) {
    throw new Error('LLM_API_KEY is required when MOCK_LLM is not 1. Copy .env.example to .env and set it.');
  }
  return {
    apiUrl: (env.LLM_API_URL || 'http://llm.codex.so').replace(/\/+$/, ''),
    apiKey,
    mock,
    port: Number(env.PORT) || 3001,
    idleTimeoutMs: Number(env.IDLE_TIMEOUT_MS) || 60000,
    rateLimitPerHour: Number(env.RATE_LIMIT_PER_HOUR) || 0,
  };
}
