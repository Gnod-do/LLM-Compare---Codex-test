import type { FastifyInstance } from 'fastify';
import type { ModelCatalog } from '../catalog.js';

export function registerModelsRoute(app: FastifyInstance, catalog: ModelCatalog) {
  app.get('/api/models', async (_req, reply) => {
    try {
      return { models: await catalog.list() };
    } catch (err) {
      app.log.error({ err }, 'failed to load models');
      return reply.status(502).send({ error: 'Не удалось загрузить список моделей' });
    }
  });
}
