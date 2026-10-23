// 資料庫層：SQLite（Node 22.13+ 內建 node:sqlite，不需額外安裝套件）
const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const path = require("path");

const db = new DatabaseSync(path.join(__dirname, "chat.db"));

const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS faqs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer   TEXT NOT NULL
  );
`);

// ---------- 預設資料 ----------
const DEFAULT_FAQS = [
  ["請問你們的營業時間？", "我們的營業時間是每天24小時營業。"],
  ["你們的地址在哪裡？", "我們的地址是台北市中山區南京東路九段9999號。"],
  ["請問要怎麼付款？", "我們提供宅配服務，您可以在店內或者線上下單。"],
  ["你們的商品有哪些？", "我們提供多種商品，包括食品、飲料、日用品、以及即時便當。"],
];

if (!db.prepare("SELECT 1 AS x FROM admins").get()) {
  db.prepare("INSERT INTO admins(username, password_hash) VALUES (?, ?)")
    .run("admin", sha256("password"));
}

if (!db.prepare("SELECT 1 AS x FROM faqs").get()) {
  const insert = db.prepare("INSERT INTO faqs(question, answer) VALUES (?, ?)");
  DEFAULT_FAQS.forEach(([question, answer]) => insert.run(question, answer));
}

// ---------- 管理員 ----------
function checkAdmin(username, password) {
  const row = db
    .prepare("SELECT 1 AS ok FROM admins WHERE username = ? AND password_hash = ?")
    .get(String(username), sha256(String(password)));
  return Boolean(row);
}

// ---------- 問答集 ----------
function listFaqs() {
  return db.prepare("SELECT id, question, answer FROM faqs ORDER BY id").all();
}

function addFaq(question, answer) {
  const result = db
    .prepare("INSERT INTO faqs(question, answer) VALUES (?, ?)")
    .run(question, answer);
  return Number(result.lastInsertRowid);
}

function updateFaq(id, question, answer) {
  const result = db
    .prepare("UPDATE faqs SET question = ?, answer = ? WHERE id = ?")
    .run(question, answer, id);
  return result.changes > 0;
}

function deleteFaq(id) {
  const result = db.prepare("DELETE FROM faqs WHERE id = ?").run(id);
  return result.changes > 0;
}

// 比對問題時忽略空白、標點與大小寫，所以「請問巧克力多少錢」可以對到「請問巧克力多少錢？」
const normalize = (text) => String(text).replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();

function findAnswer(message) {
  const target = normalize(message);
  if (!target) return null;

  const hit = listFaqs().find((faq) => normalize(faq.question) === target);
  return hit ? hit.answer : null;
}

module.exports = { checkAdmin, listFaqs, addFaq, updateFaq, deleteFaq, findAnswer };
