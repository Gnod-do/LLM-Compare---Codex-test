import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { createHandler } from '../src/vercel.js';

describe('vercel handler', () => {
  it('serves the api from a plain node (req, res) handler', async () => {
    const handler = createHandler({ MOCK_LLM: '1' });
    const server = createServer((req, res) => void handler(req, res));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/models`);
      expect(res.status).toBe(200);
      expect((await res.json()).models.length).toBeGreaterThan(1);
    } finally {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    }
  });
});
