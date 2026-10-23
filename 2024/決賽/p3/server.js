const express = require("express");
const path = require("path");
const db = require("./db");
const auth = require("./auth");

const PORT = 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // css / js

const view = (name) => path.join(__dirname, "views", name);

// ---------- 頁面 ----------
app.get("/", (req, res) => res.sendFile(view("team001.html")));

app.get("/login", (req, res) => {
  if (auth.getSession(req)) return res.redirect("/admin"); // 已登入 → 管理頁
  res.sendFile(view("login.html"));
});

app.get("/admin", (req, res) => {
  if (!auth.getSession(req)) return res.redirect("/login"); // 未登入 → 登入頁
  res.sendFile(view("admin.html"));
});

// ---------- 登入 ----------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!db.checkAdmin(username, password)) {
    return res.status(401).json({ error: "使用者或密碼錯誤！" });
  }

  auth.setLoginCookie(res, auth.createToken(username));
  res.json({ ok: true });
});

// 前端用來知道 token 何時過期，到時自動導回登入頁
app.get("/api/session", auth.requireAuth, (req, res) => {
  res.json({ exp: req.session.exp });
});

// ---------- 問答管理（需登入） ----------
function readFaqBody(req, res) {
  const question = String((req.body || {}).question || "").trim();
  const answer = String((req.body || {}).answer || "").trim();

  if (!question || !answer) {
    res.status(400).json({ error: "問題與答案不可為空" });
    return null;
  }
  return { question, answer };
}

app.get("/api/faqs", auth.requireAuth, (req, res) => {
  res.json(db.listFaqs());
});

app.post("/api/faqs", auth.requireAuth, (req, res) => {
  const body = readFaqBody(req, res);
  if (!body) return;

  const id = db.addFaq(body.question, body.answer);
  res.status(201).json({ id, ...body });
});

app.put("/api/faqs/:id", auth.requireAuth, (req, res) => {
  const body = readFaqBody(req, res);
  if (!body) return;

  const found = db.updateFaq(Number(req.params.id), body.question, body.answer);
  if (!found) return res.status(404).json({ error: "找不到這筆問答" });
  res.json({ id: Number(req.params.id), ...body });
});

app.delete("/api/faqs/:id", auth.requireAuth, (req, res) => {
  const found = db.deleteFaq(Number(req.params.id));
  if (!found) return res.status(404).json({ error: "找不到這筆問答" });
  res.status(204).end();
});

// ---------- 對話（公開） ----------
const FALLBACK_ANSWER = "很抱歉，我無法回答這個問題。";

app.post("/api/chat", (req, res) => {
  const message = (req.body || {}).message;
  res.json({ answer: db.findAnswer(message) || FALLBACK_ANSWER });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
