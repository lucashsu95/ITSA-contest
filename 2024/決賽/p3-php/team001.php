<?php
/**
 * 便利商店智慧問答客服 — 後端（前端畫面都在 team001.html）
 *
 *   /            問答對話頁
 *   /login       管理員登入頁
 *   /admin       問答管理頁（需登入）
 *   team001.php?api=login|session|faqs|chat   後端 API
 *
 * 本檔負責：資料庫、JWT 驗證、API，以及 /login、/admin 的登入檢查與導向。
 * 通過檢查後，把 team001.html 送給瀏覽器，並標記要顯示哪一個畫面。
 *
 * XAMPP：放進 htdocs，並先建立 chat 資料庫。
 */


/* =====================================================================
 * 1. 設定
 * ===================================================================== */
const JWT_SECRET  = 'change-this-secret-before-the-contest'; // 比賽前改成任意字串
const TOKEN_TTL   = 600;                                     // 10 分鐘後 token 失效
const COOKIE_NAME = 'token';
const FALLBACK_ANSWER = '很抱歉，我無法回答這個問題。';

/* =====================================================================
 * 2. HTTP 工具
 * ===================================================================== */
function out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    exit(json_encode($data, JSON_UNESCAPED_UNICODE));
}

function input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function q(string $sql, array $params = []): PDOStatement
{
    global $pdo;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// 網站根目錄（支援放在子資料夾，例如 http://localhost/team001/）
function base_url(): string
{
    $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    return $dir . '/';
}

function redirect(string $path): void
{
    header('Location: ' . base_url() . $path);
    exit;
}

/* =====================================================================
 * 3. 資料庫（XAMPP MySQL）
 * ===================================================================== */
$pdo = new PDO(
    'mysql:host=localhost;dbname=chat;charset=utf8mb4',
    'root',
    '',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);

function create_tables(): void
{
    q('
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ');

    q('
        CREATE TABLE IF NOT EXISTS faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ');
}

function seed_defaults(): void
{
    if (!q('SELECT 1 FROM admins LIMIT 1')->fetch()) {
        q(
            'INSERT INTO admins(username, password_hash) VALUES (?, ?)',
            ['admin', password_hash('password', PASSWORD_DEFAULT)]
        );
    }

    if (!q('SELECT 1 FROM faqs LIMIT 1')->fetch()) {
        $defaults = [
            ['請問你們的營業時間？', '我們的營業時間是每天24小時營業。'],
            ['你們的地址在哪裡？', '我們的地址是台北市中山區南京東路九段9999號。'],
            ['請問要怎麼付款？', '我們提供宅配服務，您可以在店內或者線上下單。'],
            ['你們的商品有哪些？', '我們提供多種商品，包括食品、飲料、日用品、以及即時便當。'],
        ];

        foreach ($defaults as $row) {
            q('INSERT INTO faqs(question, answer) VALUES (?, ?)', $row);
        }
    }
}

create_tables();
seed_defaults();

function check_admin(string $username, string $password): bool
{
    $row = q(
        'SELECT password_hash FROM admins WHERE username = ?',
        [$username]
    )->fetch();

    return $row !== false && password_verify($password, $row['password_hash']);
}

function faq_list(): array
{
    return q('SELECT id, question, answer FROM faqs ORDER BY id')->fetchAll();
}

function faq_add(string $question, string $answer): int
{
    global $pdo;

    q('INSERT INTO faqs(question, answer) VALUES (?, ?)', [$question, $answer]);
    return (int) $pdo->lastInsertId();
}

function faq_update(int $id, string $question, string $answer): bool
{
    return q(
        'UPDATE faqs SET question = ?, answer = ? WHERE id = ?',
        [$question, $answer, $id]
    )->rowCount() > 0;
}

function faq_delete(int $id): bool
{
    return q('DELETE FROM faqs WHERE id = ?', [$id])->rowCount() > 0;
}

// 比對時忽略空白、標點與大小寫，「請問巧克力多少錢」可以對到「請問巧克力多少錢？」
function normalize(string $text): string
{
    $text = preg_replace('/[\s\p{P}\p{S}]+/u', '', $text);
    return function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
}

function find_answer(string $message): ?string
{
    $target = normalize($message);
    if ($target === '') {
        return null;
    }

    foreach (faq_list() as $faq) {
        if (normalize($faq['question']) === $target) {
            return $faq['answer'];
        }
    }
    return null;
}

/* =====================================================================
 * 4. JWT（HS256，用 hash_hmac 簽章，不需要任何套件）
 * ===================================================================== */
function b64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

function sign_jwt(string $data): string
{
    return b64url_encode(hash_hmac('sha256', $data, JWT_SECRET, true));
}

function create_token(string $username, int $ttl = TOKEN_TTL): string
{
    $now = time();
    $header  = b64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = b64url_encode(json_encode(['sub' => $username, 'iat' => $now, 'exp' => $now + $ttl]));

    return "$header.$payload." . sign_jwt("$header.$payload");
}

// 驗證成功回傳 payload；簽章錯誤或過期回傳 null
function verify_token(?string $token): ?array
{
    $parts = explode('.', (string) $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    if (!hash_equals(sign_jwt("$header.$payload"), $signature)) {
        return null;
    }

    $data = json_decode(b64url_decode($payload), true);
    if (!is_array($data) || ($data['exp'] ?? 0) <= time()) {
        return null;
    }
    return $data;
}

function current_session(): ?array
{
    return verify_token($_COOKIE[COOKIE_NAME] ?? null);
}

// 保護 API：沒有有效 token 一律回 401
function require_auth(): array
{
    $session = current_session();
    if ($session === null) {
        out(['error' => '請先登入'], 401);
    }
    return $session;
}

function set_login_cookie(string $token): void
{
    setcookie(COOKIE_NAME, $token, [
        'expires'  => time() + TOKEN_TTL,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/* =====================================================================
 * 5. API
 * ===================================================================== */
function read_faq_body(): array
{
    $body = input();
    $question = trim((string) ($body['question'] ?? ''));
    $answer   = trim((string) ($body['answer'] ?? ''));

    if ($question === '' || $answer === '') {
        out(['error' => '問題與答案不可為空'], 400);
    }
    return [$question, $answer];
}

function api_login(): void
{
    $body = input();

    if (!check_admin((string) ($body['username'] ?? ''), (string) ($body['password'] ?? ''))) {
        out(['error' => '使用者或密碼錯誤！'], 401);
    }

    set_login_cookie(create_token((string) $body['username']));
    out(['ok' => true]);
}

// 前端用來得知 token 何時過期，到時自動回登入頁
function api_session(): void
{
    $session = require_auth();
    out(['exp' => $session['exp']]);
}

//   GET 列出 / POST 新增 / PUT ?id= 更新 / DELETE ?id= 刪除（全部需登入）
function api_faqs(): void
{
    require_auth();
    $id = (int) ($_GET['id'] ?? 0);

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            out(faq_list());

        case 'POST':
            [$question, $answer] = read_faq_body();
            out(['id' => faq_add($question, $answer), 'question' => $question, 'answer' => $answer], 201);

        case 'PUT':
            [$question, $answer] = read_faq_body();
            if (!faq_update($id, $question, $answer)) {
                out(['error' => '找不到這筆問答'], 404);
            }
            out(['id' => $id, 'question' => $question, 'answer' => $answer]);

        case 'DELETE':
            if (!faq_delete($id)) {
                out(['error' => '找不到這筆問答'], 404);
            }
            http_response_code(204);
            exit;
    }
    out(['error' => 'Method Not Allowed'], 405);
}

// 公開：由資料庫查詢問題並回傳答案
function api_chat(): void
{
    $message = (string) (input()['message'] ?? '');
    out(['answer' => find_answer($message) ?? FALLBACK_ANSWER]);
}

function handle_api(string $name): void
{
    $post = $_SERVER['REQUEST_METHOD'] === 'POST';

    if ($name === 'login' && $post)   api_login();
    if ($name === 'session')          api_session();
    if ($name === 'faqs')             api_faqs();
    if ($name === 'chat' && $post)    api_chat();

    out(['error' => 'Not Found'], 404);
}

/* =====================================================================
 * 6. 頁面（把 team001.html 送出，並標記目前是哪一頁）
 * ===================================================================== */
// 由網址最後一段決定要顯示哪一頁
function detect_page(): string
{
    $path = rtrim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $last = basename($path);

    if ($last === 'login') return 'login';
    if ($last === 'admin') return 'admin';
    return 'chat';
}

function serve_page(string $page): void
{
    $html = file_get_contents(__DIR__ . '/team001.html');
    $base = '<base href="' . htmlspecialchars(base_url()) . '">';

    $html = str_replace('<!-- BASE -->', $base, $html);
    $html = str_replace('<body data-page="chat">', '<body data-page="' . $page . '">', $html);

    header('Content-Type: text/html; charset=utf-8');
    echo $html;
}

/* =====================================================================
 * 7. 進入點
 * ===================================================================== */
if (isset($_GET['api'])) {
    handle_api((string) $_GET['api']);
}

$page = detect_page();

if ($page === 'login' && current_session() !== null) {
    redirect('admin');   // 已登入 → 管理頁
}
if ($page === 'admin' && current_session() === null) {
    redirect('login');   // 未登入 → 登入頁（伺服器端導向，不會先載入管理畫面）
}

serve_page($page);
