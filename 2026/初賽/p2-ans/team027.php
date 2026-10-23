<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <link rel="stylesheet" href="./bootstrap.min.css" />
  </head>
  <body>
    <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div class="container" id="logout">
        <a class="navbar-brand">GamerHub</a>
        <div id="aaa" class="m-lg-auto align-items-center gap-2">
          你好
          <button class="btn btn-danger none">登出</button>
        </div>
      </div>
    </nav>
    <div class="container">
      <div
        id="login"
        class="border p-4 border-1 rounded d-flex align-items-center justify-content-center mt-5"
      >
        <button class="btn btn-primary">登入</button>
      </div>
      <main class="">
        <section class="border border-1 p-2">
          <h1>我的喜愛清單</h1>
        </section>
        <section class="border border-1 p-2">
          <h1>發佈組隊大廳公告</h1>
        </section>
      </main>
    </div>

    <script>
      const main = document.querySelector("main");
      const loginPage = document.querySelector("#login");
      const aaa = document.querySelector("#aaa");


      function render() {
        let isLogin = localStorage.getItem("isLogin") ?? false;
        if (isLogin) {
          main.classList.remove("d-none");
        } else {
          main.classList.add("d-none");
        }
      }

      render();

      // 開
      document
        .querySelector("#login > button")
        .addEventListener("click", (e) => {
          localStorage.setItem("isLogin", 1);
          aaa.classList.add('d-flex')
          aaa.classList.remove('d-none')
          render();
        });
        
    // 關
      document
        .querySelector("#logout > button")
        .addEventListener("click", (e) => {
          localStorage.removeItem("isLogin");
          aaa.classList.add('d-none')
          aaa.classList.remove('d-flex')
          render();
        });
    </script>
  </body>
</html>
