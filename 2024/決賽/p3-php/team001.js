(function () {
  "use strict";

  const API = "team001.php";
  const apiUrl = (name, query = "") => `${API}?api=${name}${query}`;
  const jsonHeaders = { "Content-Type": "application/json" };

  /* =====================================================
   * 登入頁（/login）
   * ===================================================== */
  function initLogin() {
    const form = document.getElementById("login-form");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const response = await fetch(apiUrl("login"), {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          username: document.getElementById("username").value,
          password: document.getElementById("password").value,
        }),
      });

      if (response.ok) {
        window.location.href = "admin";
      } else {
        alert("使用者或密碼錯誤！");
      }
    });
  }

  /* =====================================================
   * 問答管理頁（/admin）
   * ===================================================== */
  function initAdmin() {
    const questionInput = document.getElementById("question");
    const answerInput = document.getElementById("answer");
    const addButton = document.getElementById("add-btn");
    const editActions = document.getElementById("edit-actions");
    const updateButton = document.getElementById("update-btn");
    const cancelButton = document.getElementById("cancel-btn");
    const faqList = document.getElementById("faq-list");

    let editingId = null; // null 代表目前是「新增模式」

    // 任何 API 回 401（未登入或 token 過期）就回到登入頁
    async function api(url, options) {
      const response = await fetch(url, {
        credentials: "same-origin",
        headers: jsonHeaders,
        ...options,
      });

      if (response.status === 401) {
        window.location.href = "login";
        throw new Error("unauthorized");
      }
      return response;
    }

    async function loadFaqs() {
      const response = await api(apiUrl("faqs"));
      renderFaqs(await response.json());
    }

    // ---------- 畫面 ----------
    function renderFaqs(faqs) {
      faqList.replaceChildren(...faqs.map(buildCard));
    }

    function buildCard(faq) {
      const card = document.createElement("div");
      card.className = "faq-card";

      const title = document.createElement("h3");
      title.textContent = faq.question;

      const text = document.createElement("p");
      text.textContent = faq.answer;

      const actions = document.createElement("div");
      actions.className = "faq-actions";

      const editButton = document.createElement("button");
      editButton.textContent = "編輯";
      editButton.addEventListener("click", () => startEdit(faq));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "刪除";
      deleteButton.addEventListener("click", () => removeFaq(faq.id));

      actions.append(editButton, deleteButton);
      card.append(title, text, actions);
      return card;
    }

    function setEditMode(isEditing) {
      addButton.hidden = isEditing;
      editActions.hidden = !isEditing;
    }

    function clearForm() {
      questionInput.value = "";
      answerInput.value = "";
      editingId = null;
      setEditMode(false);
    }

    // ---------- 動作 ----------
    function readForm() {
      const question = questionInput.value.trim();
      const answer = answerInput.value.trim();

      if (!question || !answer) {
        alert("請輸入問題與答案");
        return null;
      }
      return { question, answer };
    }

    async function addFaq() {
      const body = readForm();
      if (!body) return;

      await api(apiUrl("faqs"), { method: "POST", body: JSON.stringify(body) });
      clearForm();
      await loadFaqs();
    }

    function startEdit(faq) {
      editingId = faq.id;
      questionInput.value = faq.question;
      answerInput.value = faq.answer;
      setEditMode(true);
    }

    async function updateFaq() {
      const body = readForm();
      if (!body) return;

      await api(apiUrl("faqs", `&id=${editingId}`), { method: "PUT", body: JSON.stringify(body) });
      clearForm();
      await loadFaqs();
    }

    async function removeFaq(id) {
      await api(apiUrl("faqs", `&id=${id}`), { method: "DELETE" });
      if (editingId === id) clearForm();
      await loadFaqs();
    }

    // token 到期（10 分鐘）時自動回登入頁；多等 1 秒確保伺服器端也已判定過期
    async function scheduleAutoLogout() {
      const response = await api(apiUrl("session"));
      const { exp } = await response.json();
      setTimeout(() => (window.location.href = "login"), exp * 1000 - Date.now() + 1000);
    }

    addButton.addEventListener("click", addFaq);
    updateButton.addEventListener("click", updateFaq);
    cancelButton.addEventListener("click", clearForm);

    scheduleAutoLogout();
    loadFaqs();
  }

  /* =====================================================
   * 對話頁（/）
   * ===================================================== */
  function initChat() {
    const log = document.getElementById("chat-log");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");

    function addMessage(text, sender) {
      const bubble = document.createElement("div");
      bubble.className = `msg ${sender}`;
      bubble.textContent = text;
      log.appendChild(bubble);
      log.scrollTop = log.scrollHeight; // 自動捲到最底
    }

    async function askServer(message) {
      try {
        const response = await fetch(apiUrl("chat"), {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({ message }),
        });
        return (await response.json()).answer;
      } catch {
        return "系統忙碌中，請稍後再試。";
      }
    }

    // 按「傳送」或在輸入框按 Enter 都會觸發 submit
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const message = input.value.trim();
      if (!message) return;

      addMessage(message, "user");
      input.value = "";
      addMessage(await askServer(message), "bot");
    });

    addMessage("您好，請問有需要什麼服務嗎？", "bot");
  }

  /* =====================================================
   * 依 <body data-page="..."> 顯示對應的畫面並啟動
   * ===================================================== */
  const PAGES = {
    login: { title: "管理員登入", start: initLogin },
    admin: { title: "問答管理系統", start: initAdmin },
    chat:  { title: "便利商店智慧問答客服", start: initChat },
  };

  const name = document.body.dataset.page;
  const page = PAGES[name] || PAGES.chat;

  document.title = page.title;
  document.querySelector(`[data-view="${PAGES[name] ? name : "chat"}"]`).hidden = false;
  page.start();
})();
