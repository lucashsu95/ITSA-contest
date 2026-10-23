const express = require('express');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite'); // Node >= 22.13 內建，不需 npm 安裝

const db = new DatabaseSync(__dirname + '/queue.db');
db.exec(`
CREATE TABLE IF NOT EXISTS tickets(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT NOT NULL, seq INTEGER NOT NULL, number TEXT NOT NULL UNIQUE,
  service TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'waiting',
  created_at INTEGER NOT NULL, called_at INTEGER, finished_at INTEGER,
  UNIQUE(prefix, seq));
CREATE INDEX IF NOT EXISTS idx_status ON tickets(status, created_at, id);
CREATE UNIQUE INDEX IF NOT EXISTS one_serving ON tickets(status) WHERE status='serving';
`);

const SERVICES = { G: '一般服務', A: '開戶/申辦', C: '諮詢' };
const pad = n => String(n).padStart(2, '0');
const fmt = ms => {
  if (!ms) return null;
  const d = new Date(ms);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const dto = t => t && { number: t.number, service: t.service, createdAt: fmt(t.created_at), calledAt: fmt(t.called_at), finishedAt: fmt(t.finished_at) };
const all = (sql, ...p) => db.prepare(sql).all(...p);
const one = (sql, ...p) => db.prepare(sql).get(...p);
const state = () => ({
  current: dto(one("SELECT * FROM tickets WHERE status='serving'")) || null,
  waiting: all("SELECT * FROM tickets WHERE status='waiting' ORDER BY created_at,id").map(dto),
  history: all("SELECT * FROM tickets WHERE status='completed' ORDER BY finished_at DESC,id DESC").map(dto),
});

const sessions = new Set();
const sidOf = req => (/(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie || '') || [])[1];
const auth = (req, res, next) => sessions.has(sidOf(req)) ? next() : res.status(401).json({ error: '請先登入' });

const app = express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/api/state', (req, res) => res.json(state()));

app.post('/api/tickets', (req, res) => {
  const s = (req.body || {}).service;
  const p = Object.keys(SERVICES).find(k => k === s || SERVICES[k] === s);
  if (!p) return res.status(400).json({ error: '無此服務類別' });
  const seq = (one('SELECT MAX(seq) m FROM tickets WHERE prefix=?', p).m || 0) + 1; // 同步執行，不會有競態
  const number = p + String(seq).padStart(3, '0');
  const now = Date.now();
  db.prepare('INSERT INTO tickets(prefix,seq,number,service,created_at) VALUES(?,?,?,?,?)').run(p, seq, number, SERVICES[p], now);
  res.status(201).json({ number, service: SERVICES[p], createdAt: fmt(now) });
});

app.post('/api/login', (req, res) => {
  const b = req.body || {};
  if ((b.username ?? b.account) === 'admin' && b.password === 'password123') {
    const sid = crypto.randomBytes(24).toString('hex');
    sessions.add(sid);
    res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`);
    return res.json({ ok: true });
  }
  res.status(401).json({ error: '帳號或密碼錯誤' });
});

app.post('/api/logout', auth, (req, res) => {
  sessions.delete(sidOf(req));
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
  res.status(204).end();
});

app.post('/api/admin/next', auth, (req, res) => {
  if (one("SELECT 1 x FROM tickets WHERE status='serving'")) return res.status(409).json({ error: '請先完成目前服務' });
  const t = one("SELECT * FROM tickets WHERE status='waiting' ORDER BY created_at,id LIMIT 1");
  if (!t) return res.status(409).json({ error: '目前無等待中的號碼' });
  db.prepare("UPDATE tickets SET status='serving', called_at=? WHERE id=?").run(Date.now(), t.id);
  res.json({ current: dto(one('SELECT * FROM tickets WHERE id=?', t.id)) });
});

app.post('/api/admin/complete', auth, (req, res) => {
  const t = one("SELECT * FROM tickets WHERE status='serving'");
  if (!t) return res.status(409).json({ error: '目前無服務中的號碼' });
  db.prepare("UPDATE tickets SET status='completed', finished_at=? WHERE id=?").run(Date.now(), t.id);
  res.json({ ok: true });
});

app.get('/api/admin/history', auth, (req, res) => res.json(state().history));

app.listen(3000, () => console.log('http://localhost:3000'));
