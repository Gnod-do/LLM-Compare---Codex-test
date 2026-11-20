import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createHttpUpstream } from './upstream.js';
import { createMockUpstream } from './mockUpstream.js';

/**
 * Wraps the Fastify app as a plain Node (req, res) handler for Vercel Functions.
 * Static files are served by Vercel itself, so no staticDir here.
 */
export function createHandler(env: NodeJS.ProcessEnv = process.env) {
  const config = loadConfig(env);
  const app = buildApp({ config, upstream: config.mock ? createMockUpstream() : createHttpUpstream(config) });
  const ready = app.ready();
  return async (req: IncomingMessage, res: ServerResponse) => {
    await ready;
    app.server.emit('request', req, res);
  };
}
