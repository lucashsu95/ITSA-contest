// JWT（HS256）：用 crypto 自行簽章與驗證，不需額外套件
// 若現場可以使用 jsonwebtoken，可以直接替換 createToken / verifyToken 兩個函式
const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const TOKEN_TTL_SECONDS = 10 * 60; // 10 分鐘後自動登出
const COOKIE_NAME = "token";

const toBase64Url = (object) =>
  Buffer.from(JSON.stringify(object)).toString("base64url");

const sign = (data) =>
  crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

const nowInSeconds = () => Math.floor(Date.now() / 1000);

function createToken(username, ttlSeconds = TOKEN_TTL_SECONDS) {
  const header = toBase64Url({ alg: "HS256", typ: "JWT" });
  const issuedAt = nowInSeconds();
  const payload = toBase64Url({ sub: username, iat: issuedAt, exp: issuedAt + ttlSeconds });
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = Buffer.from(sign(`${header}.${payload}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > nowInSeconds() ? data : null;
  } catch {
    return null;
  }
}

function readCookie(req, name) {
  const match = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

// 回傳目前登入者的 token 內容；未登入或已過期回傳 null
function getSession(req) {
  return verifyToken(readCookie(req, COOKIE_NAME));
}

// 保護 API：沒有有效 token 一律 401
function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "請先登入" });
  }
  req.session = session;
  next();
}

function setLoginCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TOKEN_TTL_SECONDS}`
  );
}

module.exports = { createToken, verifyToken, getSession, requireAuth, setLoginCookie };
