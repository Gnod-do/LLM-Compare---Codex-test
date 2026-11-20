import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import type { Upstream } from './upstream.js';
import { createCatalog } from './catalog.js';
import { registerModelsRoute } from './routes/models.js';
import { registerChatRoute } from './routes/chat.js';
import { registerStatic } from './routes/static.js';

export function buildApp({ config, upstream, staticDir }: { config: Config; upstream: Upstream; staticDir?: string }): FastifyInstance {
  const app = Fastify({ logger: !process.env.VITEST });
  const catalog = createCatalog(upstream);
  registerModelsRoute(app, catalog);
  registerChatRoute(app, { config, upstream, catalog });
  if (staticDir) registerStatic(app, staticDir);
  return app;
}
