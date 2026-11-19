// Tiny static file server for development and browser tests.
// Sends "no-store" so the browser always loads the latest JS and CSS after an edit.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT ?? 8000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer(async (request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filePath = normalize(join(ROOT, urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath));

  // Never serve files outside the project folder.
  if (!filePath.startsWith(ROOT)) return send(response, 403, 'Forbidden');

  try {
    if (!(await stat(filePath)).isFile()) return send(response, 404, 'Not found');
  } catch {
    return send(response, 404, 'Not found');
  }

  response.writeHead(200, {
    'Content-Type': TYPES[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
}).listen(PORT, () => {
  console.log(`Serving on http://localhost:${PORT}`);
});

function send(response, status, text) {
  response.writeHead(status, { 'Content-Type': 'text/plain' });
  response.end(text);
}
