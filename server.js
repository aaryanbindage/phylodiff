// Serves the Phylodiff front end and a small read-only taxonomy API backed by taxa.db.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), { DatabaseSync } = require('node:sqlite');
const PORT = process.env.PORT || 3000, DB = process.env.DB_PATH || path.join(__dirname, 'taxa.db'), PUB = path.join(__dirname, 'public');
const db = new DatabaseSync(DB, { readOnly: true });
const RANKS = db.prepare('SELECT i,name FROM ranks').all().reduce((a, r) => (a[r.i] = r.name, a), []);
const TOTAL = +db.prepare("SELECT v FROM meta WHERE k='total'").get().v;
const COLS = 'id, parent AS p, rank AS r, n, name AS s, common AS c';
const q = {
  node: db.prepare(`SELECT ${COLS} FROM nodes WHERE id=?`),
  kids: db.prepare(`SELECT ${COLS} FROM nodes WHERE parent=? ORDER BY n DESC, name LIMIT ? OFFSET ?`),
  total: db.prepare('SELECT COUNT(*) AS t FROM nodes WHERE parent=?'),
  prefix: db.prepare(`SELECT ${COLS} FROM nodes WHERE name LIKE ? ESCAPE '\\' ORDER BY n DESC LIMIT ?`),
  cprefix: db.prepare(`SELECT ${COLS} FROM nodes WHERE common LIKE ? ESCAPE '\\' ORDER BY n DESC LIMIT ?`),
  contains: db.prepare(`SELECT ${COLS} FROM nodes WHERE common LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' LIMIT ?`),
  exact: db.prepare(`SELECT ${COLS} FROM nodes WHERE name=? COLLATE NOCASE LIMIT 5`)
};
const row = r => r && ({ id: r.id, p: r.p, r: RANKS[r.r], n: r.n, s: r.s, c: r.c || '' });
const esc = s => s.replace(/[\\%_]/g, m => '\\' + m);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function send(req, res, code, body, type, cache) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body), h = { 'Content-Type': type, 'Cache-Control': cache || 'no-store', 'Vary': 'Accept-Encoding' };
  if (buf.length > 1024 && /gzip/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; res.writeHead(code, h); return res.end(zlib.gzipSync(buf)); }
  res.writeHead(code, h); res.end(buf);
}
const json = (req, res, o, cache) => send(req, res, 200, JSON.stringify(o), 'application/json', cache);
function api(req, res, u) {
  const p = u.pathname, id = +u.searchParams.get('id'), cache = 'public, max-age=3600';
  if (p === '/api/stats') return json(req, res, { total: TOTAL }, cache);
  if (p === '/api/node') { const r = row(q.node.get(id)); return r ? json(req, res, r, cache) : send(req, res, 404, '{"error":"not found"}', 'application/json'); }
  if (p === '/api/children') {
    const off = Math.max(0, +u.searchParams.get('offset') || 0), lim = Math.min(500, Math.max(1, +u.searchParams.get('limit') || 200));
    return json(req, res, { total: q.total.get(id).t, offset: off, kids: q.kids.all(id, lim, off).map(row) }, cache);
  }
  if (p === '/api/path') {
    const out = []; let r = q.node.get(id), guard = 0;
    while (r && guard++ < 200) { out.push(row(r)); r = r.p ? q.node.get(r.p) : null; }
    return out.length ? json(req, res, out.reverse(), cache) : send(req, res, 404, '{"error":"not found"}', 'application/json');
  }
  if (p === '/api/search') {
    const term = (u.searchParams.get('q') || '').trim(), lim = Math.min(20, +u.searchParams.get('limit') || 10);
    if (u.searchParams.get('exact')) return json(req, res, q.exact.all(term).map(row), cache);
    if (term.length < 2) return json(req, res, []);
    const seen = new Set(), out = [], add = rs => rs.forEach(r => { if (!seen.has(r.id) && out.length < lim) { seen.add(r.id); out.push(row(r)); } });
    add(q.prefix.all(esc(term) + '%', lim)); add(q.cprefix.all(esc(term) + '%', lim));
    if (out.length < lim && term.length >= 3) add(q.contains.all('%' + esc(term) + '%', '%' + esc(term) + '%', lim));
    return json(req, res, out, 'public, max-age=300');
  }
  send(req, res, 404, '{"error":"unknown endpoint"}', 'application/json');
}
http.createServer((req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (u.pathname.startsWith('/api/')) return api(req, res, u);
    let f = path.normalize(path.join(PUB, u.pathname === '/' ? 'index.html' : u.pathname));
    if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(PUB, 'index.html');
    send(req, res, 200, fs.readFileSync(f), TYPES[path.extname(f)] || 'application/octet-stream', 'public, max-age=300');
  } catch (e) { console.error(e); send(req, res, 500, '{"error":"server error"}', 'application/json'); }
}).listen(PORT, () => console.log('Phylodiff listening on ' + PORT + ', ' + TOTAL + ' taxa'));
