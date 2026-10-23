"use strict";

/* =====================================================
 * 常數與資料儲存（localStorage：使用者、成績；sessionStorage：登入狀態）
 * ===================================================== */
const KEY_USERS = "grades.users";
const KEY_SCORES = "grades.scores";
const KEY_SESSION = "grades.session";

const PASS_SCORE = 60;
const ID_COLUMN = "學號";
const NAME_COLUMN = "姓名";
const IGNORED_COLUMNS = [ID_COLUMN, NAME_COLUMN, "平均分"];

const storage = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const $ = (id) => document.getElementById(id);
const round2 = (n) => Math.round(n * 100) / 100;

let dataset = null; // { subjects: [...], students: [{ id, name, scores: {科目: 分數} }] }
const charts = { bar: null, pie: null };

/* =====================================================
 * 共用的畫面工具
 * ===================================================== */
const VIEWS = ["login", "register", "teacher", "student"];

function showView(name) {
  VIEWS.forEach((view) => $(`view-${view}`).classList.toggle("d-none", view !== name));
  $("topbar").classList.toggle("d-none", name === "login" || name === "register");
}

function showAlert(id, text, type = "danger") {
  const box = $(id);
  box.textContent = text;
  box.className = `alert alert-${type}`;
}

function hideAlert(id) {
  $(id).className = "alert d-none";
}

function fillTable(tbody, rows) {
  tbody.replaceChildren(
    ...rows.map((cells) => {
      const tr = document.createElement("tr");
      cells.forEach((text) => {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      return tr;
    })
  );
}

function fillHeader(thead, titles) {
  const tr = document.createElement("tr");
  titles.forEach((title) => {
    const th = document.createElement("th");
    th.textContent = title;
    tr.appendChild(th);
  });
  thead.replaceChildren(tr);
}

/* =====================================================
 * 註冊 / 登入 / 登出
 * ===================================================== */
function handleRegister(event) {
  event.preventDefault();

  const name = $("reg-name").value.trim();
  const email = $("reg-email").value.trim();
  const password = $("reg-password").value;
  const roleInput = document.querySelector('input[name="role"]:checked');

  if (!name || !email || !password || !roleInput) {
    showAlert("register-msg", "請完整填寫所有欄位");
    return;
  }

  const users = storage.read(KEY_USERS, []);
  if (users.some((user) => user.email === email)) {
    showAlert("register-msg", "這個電子郵件已經註冊過了");
    return;
  }

  users.push({ name, email, password, role: roleInput.value });
  storage.write(KEY_USERS, users);

  $("register-form").reset();
  hideAlert("register-msg");
  showAlert("login-msg", "註冊成功，請登入", "success");
  showView("login");
}

function handleLogin(event) {
  event.preventDefault();

  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  const user = storage.read(KEY_USERS, []).find((u) => u.email === email && u.password === password);

  if (!user) {
    showAlert("login-msg", "電子郵件或密碼錯誤");
    return;
  }

  sessionStorage.setItem(KEY_SESSION, user.email);
  $("login-form").reset();
  hideAlert("login-msg");
  goHome(user);
}

function handleLogout() {
  sessionStorage.removeItem(KEY_SESSION);
  showView("login");
}

function currentUser() {
  const email = sessionStorage.getItem(KEY_SESSION);
  return storage.read(KEY_USERS, []).find((user) => user.email === email) || null;
}

// 依身份導向不同首頁
function goHome(user) {
  const roleText = user.role === "teacher" ? "老師" : "學生";
  $("user-label").textContent = `${user.name}（${roleText}）`;

  dataset = storage.read(KEY_SCORES, null);

  if (user.role === "teacher") {
    showView("teacher");
    if (dataset) renderTeacherReport();
  } else {
    showView("student");
    renderStudentReport(user);
  }
}

/* =====================================================
 * 老師：上傳 Excel 與解析
 * ===================================================== */
async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    dataset = await parseWorkbook(file);
    storage.write(KEY_SCORES, dataset);
    hideAlert("teacher-msg");
    renderTeacherReport();
  } catch (error) {
    showAlert("teacher-msg", `無法讀取成績檔：${error.message}`);
  }
}

async function parseWorkbook(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) throw new Error("工作表沒有資料");
  if (!(ID_COLUMN in rows[0]) || !(NAME_COLUMN in rows[0])) {
    throw new Error(`第一列必須包含「${ID_COLUMN}」與「${NAME_COLUMN}」欄位`);
  }

  // 除了學號、姓名（與已存在的平均分）以外的欄位，都當成科目
  const subjects = Object.keys(rows[0]).filter((column) => !IGNORED_COLUMNS.includes(column));

  const students = rows.map((row) => ({
    id: String(row[ID_COLUMN]).trim(),
    name: String(row[NAME_COLUMN]).trim(),
    scores: Object.fromEntries(subjects.map((subject) => [subject, Number(row[subject])])),
  }));

  return { subjects, students };
}

/* =====================================================
 * 老師：統計、表格與圖表
 * ===================================================== */
function computeStats() {
  return dataset.subjects.map((subject) => {
    const values = dataset.students.map((s) => s.scores[subject]).filter(Number.isFinite);
    const total = values.reduce((sum, value) => sum + value, 0);
    const passed = values.filter((value) => value >= PASS_SCORE).length;

    return {
      subject,
      average: total / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      passRate: (passed / values.length) * 100,
    };
  });
}

function studentAverage(student) {
  const values = dataset.subjects.map((subject) => student.scores[subject]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function renderTeacherReport() {
  $("teacher-report").classList.remove("d-none");

  const stats = computeStats();
  fillTable(
    $("stats-body"),
    stats.map((s) => [
      s.subject,
      s.average.toFixed(2),
      s.max,
      s.min,
      `${s.passRate.toFixed(2)}%`,
    ])
  );

  renderCharts(stats);

  fillHeader($("students-head"), [ID_COLUMN, NAME_COLUMN, ...dataset.subjects, "平均分"]);
  renderStudentRows();
}

function renderStudentRows() {
  const keyword = $("search-input").value.trim().toLowerCase();

  const matched = dataset.students.filter(
    (student) =>
      student.id.toLowerCase().includes(keyword) || student.name.toLowerCase().includes(keyword)
  );

  fillTable(
    $("students-body"),
    matched.map((student) => [
      student.id,
      student.name,
      ...dataset.subjects.map((subject) => student.scores[subject]),
      studentAverage(student).toFixed(2),
    ])
  );
}

function renderCharts(stats) {
  const labels = stats.map((s) => s.subject);

  if (charts.bar) charts.bar.destroy();
  if (charts.pie) charts.pie.destroy();

  // 柱狀圖：各科平均分 / 最高分 / 最低分
  charts.bar = new Chart($("bar-chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "平均分", data: stats.map((s) => round2(s.average)), backgroundColor: "rgba(75, 192, 192, 0.6)" },
        { label: "最高分", data: stats.map((s) => s.max), backgroundColor: "rgba(255, 99, 132, 0.6)" },
        { label: "最低分", data: stats.map((s) => s.min), backgroundColor: "rgba(255, 205, 86, 0.6)" },
      ],
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: "各科成績統計" } },
      scales: { y: { min: 0, max: 100 } },
    },
  });

  // 圓餅圖：各科及格率
  charts.pie = new Chart($("pie-chart"), {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: stats.map((s) => round2(s.passRate)),
          backgroundColor: ["#f2738b", "#54a6e8", "#f9ce5d", "#6fcf97", "#b388eb"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: "各科及格率" } },
    },
  });
}

/* =====================================================
 * 學生：查看個人成績（以註冊姓名對應成績表的「姓名」欄位）
 * ===================================================== */
function renderStudentReport(user) {
  const record = dataset && dataset.students.find((student) => student.name === user.name);

  if (!record) {
    $("student-report").classList.add("d-none");
    showAlert("student-msg", "目前查無您的成績資料，請確認老師已上傳成績，且註冊姓名與成績表相同。", "warning");
    return;
  }

  hideAlert("student-msg");
  $("student-report").classList.remove("d-none");
  $("student-id").textContent = record.id;
  $("student-name").textContent = record.name;
  fillTable(
    $("student-scores"),
    dataset.subjects.map((subject) => [subject, record.scores[subject]])
  );
}

/* =====================================================
 * 初始化
 * ===================================================== */
function init() {
  $("login-form").addEventListener("submit", handleLogin);
  $("register-form").addEventListener("submit", handleRegister);
  $("logout-btn").addEventListener("click", handleLogout);
  $("score-file").addEventListener("change", handleFileSelected);
  $("search-input").addEventListener("input", renderStudentRows);

  // 「前往註冊 / 返回登入」連結
  document.querySelectorAll("[data-goto]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showView(link.dataset.goto);
    });
  });

  const user = currentUser();
  if (user) goHome(user);
  else showView("login");
}

document.addEventListener("DOMContentLoaded", init);
