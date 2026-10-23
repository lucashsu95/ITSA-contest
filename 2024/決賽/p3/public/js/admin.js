(function () {
  "use strict";

  const questionInput = document.getElementById("question");
  const answerInput = document.getElementById("answer");
  const addButton = document.getElementById("add-btn");
  const editActions = document.getElementById("edit-actions");
  const updateButton = document.getElementById("update-btn");
  const cancelButton = document.getElementById("cancel-btn");
  const faqList = document.getElementById("faq-list");

  let editingId = null; // null 代表目前是「新增模式」

  // ---------- API ----------
  // 任何 API 回 401（未登入或 token 過期）就回到登入頁
  async function api(url, options) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("unauthorized");
    }
    return response;
  }

  async function loadFaqs() {
    const response = await api("/api/faqs");
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

    await api("/api/faqs", { method: "POST", body: JSON.stringify(body) });
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

    await api(`/api/faqs/${editingId}`, { method: "PUT", body: JSON.stringify(body) });
    clearForm();
    await loadFaqs();
  }

  async function removeFaq(id) {
    await api(`/api/faqs/${id}`, { method: "DELETE" });
    if (editingId === id) clearForm();
    await loadFaqs();
  }

  // token 到期（10 分鐘）時自動回到登入頁；多等 1 秒確保伺服器端也已判定過期
  async function scheduleAutoLogout() {
    const response = await api("/api/session");
    const { exp } = await response.json();
    setTimeout(() => (window.location.href = "/login"), exp * 1000 - Date.now() + 1000);
  }

  addButton.addEventListener("click", addFaq);
  updateButton.addEventListener("click", updateFaq);
  cancelButton.addEventListener("click", clearForm);

  scheduleAutoLogout();
  loadFaqs();
})();
