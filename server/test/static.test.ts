import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakeUpstream, testConfig } from './helpers.js';

function distDir() {
  const dir = mkdtempSync(join(tmpdir(), 'llmc-dist-'));
  writeFileSync(join(dir, 'index.html'), '<html>app</html>');
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'assets', 'a.js'), 'console.log(1)');
  return dir;
}

describe('static web build', () => {
  const app = buildApp({ config: testConfig, upstream: fakeUpstream(), staticDir: distDir() });

  it('serves index.html at root', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toBe('<html>app</html>');
  });

  it('serves assets with a js content type', async () => {
    const res = await app.inject({ method: 'GET', url: '/assets/a.js' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('javascript');
  });

  it('does not escape the dist directory', async () => {
    const res = await app.inject({ method: 'GET', url: '/..%2f..%2fpackage.json' });
    expect(res.body).toBe('<html>app</html>');
  });

  it('keeps api 404s as json', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
  });
});
