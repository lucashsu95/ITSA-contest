<?php

$isApiRequest =
  $_SERVER['REQUEST_METHOD'] === 'POST' &&
  ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';

if (!$isApiRequest) {
  header('Location: team27.html', true, 302);
  exit;
}

session_start();
$pdo = new PDO(
  'mysql:host=localhost;dbname=gamer_hub;charset=utf8mb4',
  'root',
  '',
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
);


function out($d, $c = 200)
{
  http_response_code($c);
  header('Content-Type: application/json; charset=utf-8');
  exit(json_encode($d, JSON_UNESCAPED_UNICODE));
}


function q($sql, $p = [])
{
  global $pdo;
  $s = $pdo->prepare($sql);
  $s->execute($p);
  return $s;
}


$a = $_GET['a'] ?? '';
$in = json_decode(file_get_contents('php://input'), true) ?: [];

if ($a === 'login') {
  $u = q('select id,username from users where username=? and password=?', [$in['u'] ?? '', $in['p'] ?? ''])->fetch();
  if (!$u) out(['error' => '帳號或密碼錯誤'], 400);
  session_regenerate_id(true); # 會產生一個新的 Session ID 
  $_SESSION['uid'] = $u['id'];
  $_SESSION['name'] = $u['username'];
  out(['ok' => 1]);
}


$uid = $_SESSION['uid'] ?? null;

if (!$uid) {                       // 未登入：fetch 回 401，直接輸入網址則導回登入頁
  if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch') out(['error' => 'unauth'], 401);
  header('Location: index.html');
  exit;
}

switch ($a) {
  case 'logout':
    session_destroy();
    out(['ok' => 1]);

  case 'addfav':
    $n = trim($in['name'] ?? '');
    if ($n === '') out(['error' => '請輸入遊戲名稱'], 400);
    q('insert ignore into games(name) values(?)', [$n]);
    $g = q('select id from games where name=?', [$n])->fetch();
    q('insert ignore into user_games(user_id,game_id) values(?,?)', [$uid, $g['id']]);
    break;

  case 'delfav':
    q('delete from user_games where user_id=? and game_id=?', [$uid, (int)($in['id'] ?? 0)]);
    break;

  case 'publish':
    $g = (int)($in['game'] ?? 0);
    $mn = (int)($in['min'] ?? 0);
    $mx = (int)($in['max'] ?? 0);
    $t = $in['when'] ?? '';
    if (!q('select 1 from user_games where user_id=? and game_id=?', [$uid, $g])->fetch() || !$t || $mn < 1 || $mx < $mn)
      out(['error' => '資料不完整或人數設定錯誤'], 400);
    q('insert into recruits(game_id,host_id,start_time,min_players,max_players) values(?,?,?,?,?)', [$g, $uid, str_replace('T', ' ', $t), $mn, $mx]);
    q('insert into recruit_members(recruit_id,user_id) values(?,?)', [$pdo->lastInsertId(), $uid]);
    break;

  case 'join':
    $id = (int)($in['id'] ?? 0);
    $pdo->beginTransaction();
    $r = q('select * from recruits where id=? for update', [$id])->fetch();
    $c = q('select count(*) from recruit_members where recruit_id=?', [$id])->fetchColumn();
    $j = q('select 1 from recruit_members where recruit_id=? and user_id=?', [$id, $uid])->fetch();
    if (!$r || $c >= $r['max_players'] || $j) {
      $pdo->rollBack();
      out(['error' => '無法加入'], 400);
    }
    q('insert into recruit_members(recruit_id,user_id) values(?,?)', [$id, $uid]);
    $pdo->commit();
    break;

  case 'state':
    break;

  default:
    out(['error' => 'bad action'], 400);
}

$base = "select r.id, r.game_id, g.name game, r.start_time, r.min_players mn, r.max_players mx, u.username host,
  (select count(*) from recruit_members m where m.recruit_id=r.id) cnt,
  exists(select 1 from recruit_members m where m.recruit_id=r.id and m.user_id=?) joined
  from recruits r join games g on g.id=r.game_id join users u on u.id=r.host_id";


out([
  'me' => $_SESSION['name'],
  'favs' => q('select g.id,g.name from user_games ug join games g on g.id=ug.game_id where ug.user_id=? order by g.id', [$uid])->fetchAll(),
  'lobby' => q("select * from ($base) t where cnt<mx and game_id in (select game_id from user_games where user_id=?) order by start_time", [$uid, $uid])->fetchAll(),
  'cal' => q("select * from ($base) t where joined=1 and cnt>=mn order by start_time", [$uid])->fetchAll(),
]);
