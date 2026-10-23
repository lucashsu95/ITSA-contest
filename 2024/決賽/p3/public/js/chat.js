(function () {
  "use strict";

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
})();
