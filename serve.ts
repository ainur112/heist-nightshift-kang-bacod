// Local static server for game/ — `node serve.ts`, then open http://localhost:8080.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const port = 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
};

createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname); }
  catch { res.writeHead(400).end('bad request'); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('forbidden'); return; }
  try {
    const s = statSync(file);
    if (!s.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'content-length': s.size, 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`NIGHTSHIFT on http://localhost:${port}`));
