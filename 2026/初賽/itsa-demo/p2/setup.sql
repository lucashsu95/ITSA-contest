-- 我自己猜的結構；正式比賽請用主辦給的 gamershub.sql，再對照改 api.php 的欄位名
CREATE DATABASE IF NOT EXISTS gamer_hub CHARACTER SET utf8mb4;
USE gamer_hub;
CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(100));
CREATE TABLE games(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) UNIQUE);
CREATE TABLE user_games(user_id INT, game_id INT, PRIMARY KEY(user_id, game_id));
CREATE TABLE recruits(id INT AUTO_INCREMENT PRIMARY KEY, game_id INT, host_id INT, start_time DATETIME, min_players INT, max_players INT);
CREATE TABLE recruit_members(recruit_id INT, user_id INT, PRIMARY KEY(recruit_id, user_id));
INSERT INTO users(username,password) VALUES('yaya','1234'),('TenZ','1234'),('bob','1234');
INSERT INTO games(name) VALUES('LOL'),('特戰英豪 (Valorant)'),('Apex 英雄');
INSERT INTO user_games VALUES(1,1),(1,2),(2,1),(2,2),(3,3);
INSERT INTO recruits(game_id, host_id, start_time, min_players, max_players)
VALUES (1, 1, '2026-11-01 20:00:00', 2, 4),
       (2, 2, '2026-11-02 21:00:00', 2, 3),
       (3, 3, '2026-11-03 19:00:00', 3, 5);

INSERT INTO recruit_members(recruit_id, user_id)
VALUES (1, 1), (1, 2), (2, 2), (3, 3);