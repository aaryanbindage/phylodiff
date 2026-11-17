// Builds taxa.db with every node of the NCBI taxonomy.
// (previously filtered; now unfiltered) (SQLite) from the NCBI taxonomy dump. Usage: node build-db.js <dir with nodes.dmp and names.dmp> <out.db>
const fs = require('fs'), readline = require('readline'), { DatabaseSync } = require('node:sqlite');
const dir = process.argv[2] || '.', out = process.argv[3] || 'taxa.db';
const DROP = new Set(['strain', 'isolate', 'serotype', 'serogroup', 'forma specialis', 'forma', 'pathogroup', 'biotype', 'morph', 'genotype', 'subvariety']);
const SPECIES = new Set(['species', 'subspecies', 'varietas']);
const BAD = /environmental|uncultured|unclassified|metagenome|unidentified|synthetic construct|\bsp\.|\bcf\.|\baff\.|\bgen\. |^other sequences|^unknown/i;
async function lines(f, cb) { const rl = readline.createInterface({ input: fs.createReadStream(f), crlfDelay: Infinity }); for await (const l of rl) cb(l); }
(async () => {
  const t0 = Date.now(), log = m => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', m);
  const N = 1 << 23, parent = new Int32Array(N), rankIx = new Uint8Array(N), exists = new Uint8Array(N), RANKS = [], rmap = new Map();
  await lines(dir + '/nodes.dmp', l => { const p = l.split('\t|\t'), id = +p[0]; parent[id] = +p[1]; let r = rmap.get(p[2]); if (r === undefined) { r = RANKS.length; RANKS.push(p[2]); rmap.set(p[2], r); } rankIx[id] = r; exists[id] = 1; });
  log('nodes read, ranks: ' + RANKS.length);
  const sci = new Map(), common = new Map();
  await lines(dir + '/names.dmp', l => { const p = l.split('\t|\t'); const c = p[3].slice(0, p[3].indexOf('\t')); const id = +p[0];
    if (c === 'scientific name') sci.set(id, p[1]); else if (c === 'genbank common name') common.set(id, p[1]); else if (c === 'common name' && !common.has(id)) common.set(id, p[1]); });
  log('names read: ' + sci.size);
  // keep flags, resolved top-down with an explicit stack
  const state = new Uint8Array(N), below = new Uint8Array(N); // state: 0 unknown, 1 keep, 2 drop
  state[1] = 1;
  const spIx = new Set([...SPECIES].map(r => rmap.get(r)).filter(x => x !== undefined)), noRank = rmap.get('no rank');
  for (let id = 1; id < N; id++) {
    if (!exists[id] || state[id]) continue;
    const stack = []; let x = id;
    while (x !== 1 && !state[x] && exists[x]) { stack.push(x); x = parent[x]; if (stack.length > 100) break; }
    let pk = state[x] === 1;
    while (stack.length) {
      const y = stack.pop(), p = parent[y], r = RANKS[rankIx[y]], nm = sci.get(y) || '';
      below[y] = (spIx.has(rankIx[y]) || below[p]) ? 1 : 0;
      const bp = spIx.has(rankIx[p]) || below[p];
      const keep = pk && nm; // full NCBI taxonomy: every node with a name is kept
      state[y] = keep ? 1 : 2; pk = keep;
    }
  }
  let kept = 0; for (let id = 1; id < N; id++) if (state[id] === 1) kept++;
  log('kept nodes: ' + kept);
  // descendant counts via CSR + iterative DFS
  const cnt = new Int32Array(N); for (let id = 2; id < N; id++) if (state[id] === 1) cnt[parent[id]]++;
  const start = new Int32Array(N + 1); for (let i = 0; i < N; i++) start[i + 1] = start[i] + cnt[i];
  const fill = new Int32Array(N), list = new Int32Array(start[N]);
  for (let id = 2; id < N; id++) if (state[id] === 1) { const p = parent[id]; list[start[p] + fill[p]++] = id; }
  const order = [], st = [1]; while (st.length) { const x = st.pop(); order.push(x); for (let i = start[x]; i < start[x + 1]; i++) st.push(list[i]); }
  const n = new Int32Array(N); for (let i = order.length - 1; i > 0; i--) { const x = order[i]; n[parent[x]] += 1 + n[x]; }
  log('counts done, root=' + n[1]);
  try { fs.unlinkSync(out); } catch (e) {}
  const db = new DatabaseSync(out);
  db.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; CREATE TABLE ranks(i INTEGER PRIMARY KEY, name TEXT); CREATE TABLE nodes(id INTEGER PRIMARY KEY, parent INTEGER, rank INTEGER, n INTEGER, name TEXT COLLATE NOCASE, common TEXT COLLATE NOCASE);');
  const ir = db.prepare('INSERT INTO ranks VALUES(?,?)'); RANKS.forEach((r, i) => ir.run(i, r));
  const ins = db.prepare('INSERT INTO nodes VALUES(?,?,?,?,?,?)');
  db.exec('BEGIN'); let k = 0;
  for (let id = 1; id < N; id++) if (state[id] === 1) { ins.run(id, id === 1 ? 0 : parent[id], rankIx[id], n[id], id === 1 ? 'Life' : sci.get(id), common.get(id) || null); if (++k % 200000 === 0) log('inserted ' + k); }
  db.exec('COMMIT'); log('indexing');
  db.exec('CREATE INDEX i_kids ON nodes(parent, n DESC, name); CREATE INDEX i_name ON nodes(name COLLATE NOCASE); CREATE INDEX i_common ON nodes(common COLLATE NOCASE) WHERE common IS NOT NULL;');
  db.exec("CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT)"); db.prepare('INSERT INTO meta VALUES(?,?)').run('total', String(k));
  db.close(); log('done: ' + k + ' nodes, ' + (fs.statSync(out).size / 1e6).toFixed(0) + ' MB');
})();
