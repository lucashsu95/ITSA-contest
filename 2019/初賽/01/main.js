let articleIdCount = 0;
let replayIdCount = 0;

class Article {
  constructor(title, content, postBy, pass) {
    this.id = articleIdCount++;
    this.title = title;
    this.content = content;
    this.postBy = postBy;
    this.replays = [];
    this.pass = pass;
  }
}

class Replay {
  constructor(postBy, content) {
    this.id = replayIdCount++;
    this.postBy = postBy;
    this.content = content;
  }
}

// seeder
const articlies = [
  new Article("Title 1", "Content 1", "疑惑的人", "1234"),
  new Article("Title 2", "Content 2", "帥氣的人", "234"),
  new Article("Title 3", "Content 3", "害羞的人", "345"),
];

articlies[0].replays.push(new Replay("路人甲", "回覆內容1"));
articlies[0].replays.push(new Replay("亂入的人", "回覆內容2"));
articlies[1].replays.push(new Replay("帥哥1號", "差我一點"));
articlies[2].replays.push(new Replay("呵呵呵呵", "我也是"));

function createArticle(title, content, postBy, pass) {
  const article = new Article(title, content, postBy, pass);
  articlies.push(article);
}

function createReplay(postBy, content, article_id) {
  const replay = new Replay(postBy, content);
  articlies.find((article) => article.id === article_id).replays.push(replay);
}

const articleListPage = document.querySelector("#article-list-page");
const ArticlePage = document.querySelector("#article-page");
const addArticlePage = document.querySelector("#add-article-page");
const replyArticlePage = document.querySelector("#reply-article-page");

const pages = {
  articleListPage: articleListPage,
  addArticlePage: addArticlePage,
  replyArticlePage: replyArticlePage,
  articlePage: ArticlePage,
};

function changePage(pageKey) {
  Object.keys(pages).forEach((p) => {
    pages[p].style.display = "none";
  });
  pages[pageKey].style.display = "block";
}

changePage("articleListPage");

// <------------------- add article ------------------------>

const title = document.querySelector("#add-article-title");
const content = document.querySelector("#add-article-content");
const postBy = document.querySelector("#add-article-postBy");
const pass = document.querySelector("#add-article-pass");

const addArticleForm = document.querySelector("form#add-article-form");
const backBtn = document.querySelector("#add-article-page > .back-btn");

document.querySelector("#add-article").addEventListener("click", () => {
  changePage("addArticlePage");

  function onSubmit(e) {
    e.preventDefault();
    createArticle(title.value, content.value, postBy.value, pass.value);
    renderArticleList();
    changePage("articleListPage");

    addArticleForm.reset();
    addArticleForm.removeEventListener("submit", onSubmit);
  }

  backBtn.addEventListener("click", () => {
    changePage("articleListPage");
    addArticleForm.reset();
    addArticleForm.removeEventListener("submit", onSubmit);
  });

  addArticleForm.addEventListener("submit", onSubmit);
});

// <------------------- show article list ------------------------>
const articleListTable = document.querySelector("#article-table .table__body");

function renderArticleList() {
  articleListTable.innerHTML = "";
  articlies.forEach((article) => {
    const articleElement = document.createElement("tr");
    articleElement.onclick = () => showArticle(article.id);
    articleElement.innerHTML = `
        <td>${article.title}</td>
        <td>${article.postBy}</td>
        `;
    articleListTable.appendChild(articleElement);
  });
}

renderArticleList();

// <------------------- show article ------------------------>
const articleTable = document.querySelector("#article .table__body");
let currentArticleId = null;
function showArticle(article_id) {
  document.querySelector("#article-title").textContent = article.title;
  articleTable.innerHTML = "";
  currentArticleId = article_id;
  const article = articlies.find((article) => article.id === article_id);
  const articleElement = document.createElement("tr");
  articleElement.innerHTML = `
      <td>${article.postBy}</td>
      <td>${article.content}</td>
    `;
  articleTable.appendChild(articleElement);

  article.replays.forEach((replay) => {
    const replayElement = document.createElement("tr");
    replayElement.innerHTML = `
        <td>${replay.postBy}</td>
        <td>${replay.content}</td>
    `;
    articleTable.appendChild(replayElement);
  });

  changePage("articlePage");
}

// <------------------- reply ------------------------>
const replyForm = document.querySelector("#reply-article-form");
const articleTitle = document.querySelector("#reply-article-title");
document.querySelector("#reply-article").addEventListener("click", () => {
  changePage("replyArticlePage");
  const article = articlies.find((article) => article.id === currentArticleId);
  articleTitle.textContent = article.title;
  changePage("replyArticlePage");
});

replyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const postBy = document.querySelector("#reply-postBy-input").value;
  const content = document.querySelector("#reply-content-input").value;
  createReplay(postBy, content, currentArticleId);
  renderArticleList();
  changePage("articleListPage");
});

// <------------------- edit ------------------------>
document.querySelector("#edit-article").addEventListener("click", () => {
  const article = articlies.find((a) => a.id === currentArticleId);
  if (prompt("請輸入密碼") != article.pass) {
    alert("密碼錯誤");
    return;
  }
  changePage("addArticlePage");

  title.value = article.title;
  content.value = article.content;
  postBy.value = article.postBy;
  pass.value = article.pass;

  function onSubmit(e) {
    e.preventDefault();

    article.title = title.value;
    article.content = content.value;
    article.postBy = postBy.value;
    article.pass = pass.value;

    renderArticleList();
    changePage("articleListPage");
    currentArticleId = null;
    addArticleForm.reset();
    addArticleForm.removeEventListener("submit", onSubmit);
  }

  backBtn.addEventListener("click", () => {
    changePage("articleListPage");
    addArticleForm.reset();
    addArticleForm.removeEventListener("submit", onSubmit);
  });

  addArticleForm.addEventListener("submit", onSubmit);
});
