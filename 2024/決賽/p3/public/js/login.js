(function () {
  "use strict";

  const form = document.getElementById("login-form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
      }),
    });

    if (response.ok) {
      window.location.href = "/admin";
    } else {
      alert("使用者或密碼錯誤！");
    }
  });
})();
