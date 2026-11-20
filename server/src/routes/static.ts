import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import type { FastifyInstance } from 'fastify';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

/** Serves the built web app (SPA fallback to index.html) so production runs on one port. */
export function registerStatic(app: FastifyInstance, dir: string) {
  const root = resolve(dir);
  app.setNotFoundHandler(async (req, reply) => {
    if (req.method !== 'GET' || req.url.startsWith('/api/')) return reply.status(404).send({ error: 'Not found' });
    let pathname = '/';
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch { /* malformed escape: fall back to index */ }
    let file = resolve(join(root, pathname));
    if (!file.startsWith(root + sep) || !(await isFile(file))) file = join(root, 'index.html');
    reply.type(TYPES[extname(file)] ?? 'application/octet-stream');
    return reply.send(await readFile(file));
  });
}

async function isFile(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
