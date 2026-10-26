# ITSA 比賽現場筆記產生器

HTML + CSS 產生內容，再用 Chromium 轉成 A4 PDF（不是 LaTeX）。

## 執行（uv）

```bash
uv sync                              # 建立 .venv 並安裝 pygments、playwright
uv run playwright install chromium   # 只需做一次，下載 Chromium
uv run build.py                      # 產生 notes-color.html / notes-mono.html
uv run render.py                     # 產生 ITSA-notes-color.pdf / ITSA-notes-mono.pdf
```

不想裝 Playwright 的話：只跑 `uv run build.py`，用 Chrome 開 `notes-color.html`，
Ctrl+P → 另存為 PDF → 勾選「背景圖形」、邊界選「預設」。

## 第 1 頁的索引（自動產生）

每個章節、小節、程式碼區塊、提示框的標題都會登記到索引。`render.py` 會先轉一次 PDF，
用 pypdf 找出每個標題在第幾頁，把頁碼寫回索引，再轉出最終 PDF。所以改了內容之後，
只要重新跑 `uv run build.py` 和 `uv run render.py`，頁碼就會自己更新。
結尾會印 `OK`；如果印「找不到頁碼」，代表某個標題在 PDF 裡比對不到（通常是標題太短或太常見）。

## 想改什麼

| 想改 | 位置 |
|---|---|
| 筆記內容 | `build.py` 裡的 `A(...)`；`card(...)` / `block(...)` 是程式碼區塊 |
| 章節顏色 | `sec("標題", "#色碼", "語言")` 的第二個參數 |
| 程式碼語法上色語言 | `sec(...)` 第三個參數（預設語言）；個別區塊傳 `lang="sql"` / `"text"` |
| 區塊外觀 | `COLOR_CSS`：`pre.hl`（程式碼框）、`.box`（提示框）目前都是只有框、沒有底色 |
| 語法配色 | `PYGMENTS_STYLE`（例如 `friendly`、`tango`、`colorful`） |
| 字體大小、版面 | `COLOR_CSS`（`pre.hl` 是程式碼字級、`@page` 是邊界） |

黑白版（`notes-mono.html`）把主題色壓成灰階、不做語法上色，適合省墨。
字型：中文會依序找 Noto Sans CJK TC、微軟正黑體、PingFang TC。
