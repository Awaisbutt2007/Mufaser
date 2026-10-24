#!/usr/bin/env node
/**
 * Local preview server: serves dist/ and a MOCK of the platform inquiry API.
 *
 *   node scripts/serve.mjs                 # http://localhost:4321  (dist + mock API)
 *   node scripts/serve.mjs --mock-only     # http://localhost:4322  (mock API for `astro dev`)
 *   MOCK_INQUIRY_MODE=fail|ratelimit ...   # simulate platform failures
 *
 * The mock mirrors the production contract (POST /api/inquiries, JSON body,
 * idempotency-key header, { data: { id } } on success, { error } on failure).
 * Nothing is sent anywhere; submissions are kept in memory only.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const mockOnly = process.argv.includes('--mock-only');
const port = Number(process.env.PORT || (mockOnly ? 4322 : 4321));
const root = resolve(process.cwd(), 'dist');
const mode = process.env.MOCK_INQUIRY_MODE || 'ok';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

export const received = [];
const seenKeys = new Map();
const hits = new Map();

const str = (v, max, min = 0) => typeof v === 'string' && v.trim().length >= min && v.length <= max;

function validate(b) {
  if (!b || typeof b !== 'object') return false;
  if (b.kind !== 'quote' || b.consent !== true) return false;
  if (!b.source || typeof b.source.key !== 'string') return false;
  const c = b.contact ?? {};
  if (!str(c.name, 120, 1)) return false;
  if (!c.email && !c.phone) return false;
  if (c.email !== undefined && (!str(c.email, 254, 3) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))) return false;
  if (c.phone !== undefined && !str(c.phone, 40, 4)) return false;
  if (c.company !== undefined && !str(c.company, 160)) return false;
  if (c.country !== undefined && !str(c.country, 100)) return false;
  const r = b.request ?? {};
  if (!str(r.message, 5000, 10) || !str(r.subject, 200, 1)) return false;
  if (!Array.isArray(r.productReferences) || !r.productReferences.every((p) => str(p, 120, 1))) return false;
  if (r.quantity !== undefined && !(Number.isInteger(r.quantity) && r.quantity > 0 && r.quantity <= 1_000_000)) return false;
  return true;
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function handleInquiry(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  const ip = req.socket.remoteAddress ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (mode === 'ratelimit' || recent.length > 20) return send(res, 429, { error: 'too_many_requests' });
  if (mode === 'fail') return send(res, 503, { error: 'inquiry_unavailable' });

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 64_000) return send(res, 413, { error: 'invalid_request' });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'invalid_request' }); }
  if (!validate(body)) return send(res, 400, { error: 'invalid_request' });

  const key = req.headers['idempotency-key'];
  if (typeof key !== 'string' || key.length < 8) return send(res, 400, { error: 'invalid_request' });
  if (seenKeys.has(key)) return send(res, 200, { data: { id: seenKeys.get(key) } });

  const id = `inq_mock_${randomUUID().slice(0, 8)}`;
  seenKeys.set(key, id);
  const spam = typeof body.website === 'string' && body.website.trim() !== '';
  received.push({ id, spam, body });
  console.log(`[mock] inquiry ${id}${spam ? ' (honeypot: discarded)' : ''} — ${body.request.productReferences.join(', ')}`);
  return send(res, 201, { data: { id } });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(file);
    if (s.isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { location: `${path}/${url.search}` }); return res.end(); }
      file = join(file, 'index.html');
    }
    const data = await readFile(file);
    const ext = extname(file);
    const immutable = path.startsWith('/_astro/') || path.startsWith('/fonts/');
    res.writeHead(200, {
      'content-type': types[ext] ?? 'application/octet-stream',
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=600',
    });
    res.end(data);
  } catch {
    const notFound = await readFile(join(root, '404.html')).catch(() => Buffer.from('Not found'));
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(notFound);
  }
}

createServer((req, res) => {
  if (req.url?.startsWith('/api/inquiries')) return void handleInquiry(req, res);
  if (mockOnly) return send(res, 404, { error: 'not_found' });
  return void serveStatic(req, res);
}).listen(port, () => {
  console.log(`${mockOnly ? 'Mock inquiry API' : 'Preview'} on http://localhost:${port} (mode: ${mode})`);
});
