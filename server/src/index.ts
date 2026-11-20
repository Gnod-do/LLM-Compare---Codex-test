import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createHttpUpstream } from './upstream.js';
import { createMockUpstream } from './mockUpstream.js';

const config = loadConfig(process.env);
const upstream = config.mock ? createMockUpstream() : createHttpUpstream(config);
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
const app = buildApp({ config, upstream, staticDir: existsSync(webDist) ? webDist : undefined });

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
  app.log.info(`LLM Compare server on :${config.port} (${config.mock ? 'MOCK' : config.apiUrl})`);
});
