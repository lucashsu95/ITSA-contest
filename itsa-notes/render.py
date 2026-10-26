#!/usr/bin/env python3
"""把 notes-color.html / notes-mono.html 轉成 A4 PDF，並自動填好第 1 頁索引的頁碼

    uv run playwright install chromium     # 只需做一次
    uv run render.py

流程：先轉一次 PDF → 用 pypdf 找出每個標題在第幾頁 → 把頁碼寫回索引 → 再轉出最終 PDF
"""
import re
import tempfile
import unicodedata
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader

JOBS = [
    ("notes-color.html", "ITSA-notes-color.pdf"),   # 全彩
    ("notes-mono.html", "ITSA-notes-mono.pdf"),     # 黑白省墨
]

FOOTER = (
    '<div style="width:100%;font-size:7px;text-align:center;font-family:sans-serif;">'
    'ITSA 比賽現場筆記　‧　第 <span class="pageNumber"></span> / <span class="totalPages"></span> 頁</div>'
)


def squash(text):
    """比對前先正規化：NFKC 會把 PDF 抽出來的康熙部首（⽤、⼊、⾴ …）還原成一般漢字，
    再去掉所有空白，避免換行或全形空白造成比對失敗"""
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", text))


def fuzzy(title):
    """PDF 抽出的字有時會被換成長得像的部首字（例：長 → ⻑），NFKC 也還原不了。
    這時退而求其次：英數字照原樣比，其餘每個字元當成「任一字元」"""
    return re.compile("".join(re.escape(c) if c.isascii() and c.isalnum() else "." for c in title))


def locate_pages(pdf_path, items):
    """items 依文件順序排列 → 回傳 {id: 頁碼}；標題在 PDF 文字裡第一次出現的頁"""
    pages = [squash(p.extract_text() or "") for p in PdfReader(pdf_path).pages]
    result, cursor, missing = {}, 1, []          # cursor 是 0 起算的頁索引；第 0 頁是封面與索引
    for item in items:
        if item["cover"]:
            result[item["id"]] = 1               # 封面上的內容一律是第 1 頁
            continue
        title = squash(item["title"])
        rng = range(cursor, len(pages))
        found = next((i for i in rng if title in pages[i]), None)          # 先用原字比對
        if found is None:
            pattern = fuzzy(title)
            found = next((i for i in rng if pattern.search(pages[i])), None)   # 再用寬鬆比對
        if found is None:
            missing.append(item["title"])
            found = cursor
        cursor = found
        result[item["id"]] = found + 1
    return result, missing, len(pages)


def export(page, path):
    page.pdf(
        path=str(path),
        format="A4",
        print_background=True,               # 全彩一定要開，否則背景色與色塊不會印出來
        display_header_footer=True,
        header_template="<div></div>",
        footer_template=FOOTER,
        margin={"top": "9mm", "bottom": "11mm", "left": "9mm", "right": "9mm"},
    )


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    for source, target in JOBS:
        page.goto(Path(source).resolve().as_uri())
        items = page.evaluate(
            """() => [...document.querySelectorAll('.pg')].map(e =>
                 ({ id: e.dataset.id, title: e.dataset.title, cover: e.dataset.cover === '1' }))"""
        )

        # 第一次：找每個標題的頁碼
        with tempfile.TemporaryDirectory() as tmp:
            first_pass = Path(tmp) / "pass1.pdf"
            export(page, first_pass)
            numbers, missing, total = locate_pages(first_pass, items)

        page.evaluate(
            """(numbers) => document.querySelectorAll('.pg').forEach(e => { e.textContent = numbers[e.dataset.id]; })""",
            numbers,
        )

        # 第二次：頁碼已填好，輸出最終 PDF（索引寬度不變，所以分頁不會跑掉）
        export(page, target)
        check, _, total_after = locate_pages(target, items)
        status = "OK" if check == numbers and total == total_after and not missing else "有問題，請看下面的訊息"
        print(f"wrote {target}  ({total_after} 頁，索引 {len(items)} 筆，{status})")
        for title in missing:
            print("  找不到頁碼：", title)

    browser.close()
