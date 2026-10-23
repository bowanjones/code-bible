// A tiny static file server for tests (no dependencies).
//   node tests/serve.js                 serve the project folder on :4173
//   SERVE_DIR=_site node tests/serve.js serve the built site instead
// The app is also reachable under /code-bible/ so tests can prove it works from
// a sub-folder, exactly like GitHub Pages hosts it.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.env.SERVE_DIR || path.join(__dirname, '..'));
const PORT = Number(process.env.PORT || 4173);
const PREFIX = '/code-bible';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch (e) { res.writeHead(400); return res.end('Bad request'); }

  if (urlPath === PREFIX) { res.writeHead(301, { Location: PREFIX + '/' }); return res.end(); }
  if (urlPath.startsWith(PREFIX + '/')) urlPath = urlPath.slice(PREFIX.length);

  let file = path.resolve(ROOT, '.' + urlPath);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}/`));
