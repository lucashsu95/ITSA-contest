let noteIdCount = 0;

class Note {
  constructor(title, content, tags) {
    this.id = noteIdCount++;
    this.title = title;
    this.content = content;
    this.tags = tags;
  }

  getContent() {
    alert(this.content);
  }
}

class Tag {
  constructor(name) {
    this.name = name;
  }
}

const selectedTags = ["美食", "學習"];

const tags = [
  new Tag("美食"),
  new Tag("旅遊"),
  new Tag("學習"),
  new Tag("生活"),
  new Tag("前端"),
  new Tag("後端"),
];

let notes = [
  new Note("彰化八卦山美食", "彰化八卦山美食的內文", ["生活", "美食"]),
  new Note("彰化八卦山景點", "彰化八卦山景點的內文", ["旅遊", "生活"]),
  new Note("花東三日遊", "花東三日遊的內文", ["旅遊", "生活"]),
  new Note("日本北海道五日遊", "我想去泡溫泉", ["旅遊", "生活"]),
  new Note("React學習筆記", "Vue不香嗎?", ["學習", "前端"]),
  new Note("Java學習筆記", "interface是什麼鬼www", ["後端", "前端"]),
  new Note("微積分學習筆記", "我好爛 嗚嗚嗚", ["學習"]),
  new Note("Github", "git rebase -i main 哈哈", ["學習"]),
];

const notesDiv = document.querySelector("#view-note-list");
const addNoteTagsSelectBar = document.querySelector(
  "#add-note-tags-select-bar"
);

// <---------------------- Tag ---------------------->

addNoteTagsSelectBar.addEventListener("change", (e) => {
  const selectedTag = e.target;
  if (selectedTag.value === "=== 請選擇筆記分類 ===") {
    selectedTag.value = "";
    return;
  }
  if (selectedTags.includes(selectedTag.value)) {
    return;
  }

  selectedTags.push(e.target.value);
  renderTags();
});

function addTag(e) {
  e.preventDefault();
  const tagName = document.querySelector("#tag-name");
  if (tagName.value) {
    if (tags.find((tag) => tag.name === tagName.value)) {
      alert("分類已存在");
      return;
    }
    tags.push(new Tag(tagName.value));
    tagName.value = "";
    renderTags();
  }
}

function removeSelectedTag(e) {
  if (e.target.tagName === "BUTTON") {
    e.target.parentElement.remove();
    const tagName = e.target.parentElement.textContent.trim();
    const removeIndex = selectedTags.indexOf((tag) => tagName.includes(tag));
    selectedTags.splice(removeIndex, 1);
  }
}

const selectedTagsSelect = document.querySelector("#selected-tags");
const tagsSelectBarSelect = document.querySelector("select.tags-select-bar");

function renderTags() {
  selectedTagsSelect.innerHTML = "";
  selectedTags.forEach((tag) => {
    selectedTagsSelect.innerHTML += `
        <span class="tag"">
            ${tag}
            <button type="button" onclick="removeSelectedTag(event)">X</button>
        </span>`;
  });

  addNoteTagsSelectBar.innerHTML =
    "<option class='tag'>=== 請選擇筆記分類 ===</option>";
  tagsSelectBarSelect.innerHTML = "<option value='全部'>全部</option>";
  tags.forEach((tag) => {
    const tagSelect = document.createElement("option");
    tagSelect.value = tag.name;
    tagSelect.innerHTML = tag.name;
    tagsSelectBarSelect.appendChild(tagSelect);
    addNoteTagsSelectBar.appendChild(tagSelect.cloneNode(true));
  });
}
renderTags();

// <---------------------- Note ---------------------->

const title = document.querySelector("#note-title");
const content = document.querySelector("#note-content");
let modifyNoteId = null;

function editNote(e) {
  e.preventDefault();
  if (modifyNoteId === null) {
    notes.push(new Note(title.value, content.value, [...selectedTags]));
  } else {
    const note = notes.find((n) => n.id === modifyNoteId);
    note.title = title.value;
    note.content = content.value;
    note.tags = [...selectedTags];
    modifyNoteId = null;
  }
  title.value = "";
  content.value = "";
  selectedTags.length = 0;
  renderNotes();
  changePage(0);
}

let filterTags = "全部";
function filterNotes(e) {
  filterTags = e.target.value;
  renderNotes();
}

function searchNotes(e) {
  e.preventDefault();
  renderNotes();
}

function setupModifyNote(id) {
  const note = notes.find((note) => note.id === id);
  modifyNoteId = id;
  const title = document.querySelector("#note-title");
  const content = document.querySelector("#note-content");
  title.value = note.title;
  content.value = note.content;
  selectedTags.length = 0;
  selectedTags.push(...note.tags);
  console.log(selectedTags);

  changePage(2);
  renderTags();
}

function removeNote(id) {
  notes = notes.filter((note) => note.id !== id);
  renderNotes();
}

function getNoteContent(id) {
  const note = notes.find((note) => note.id === id);
  note.getContent();
}

const searchNoteList = document.querySelector("#search-note-list");
function renderNotes() {
  const searchValue = document.querySelector("#search-note-input");

  notesDiv.innerHTML = "";
  searchNoteList.innerHTML = "";

  notes.forEach((note) => {
    if (note.title.includes(searchValue.value)) {
      searchNoteList.innerHTML += `
            <div class="note">
                <h3>${note.title}</h3>
                <div>
                    <button class="btn" onclick="getNoteContent(${note.id})">閱覽</button>
                    <button class="btn" onclick="setupModifyNote(${note.id})">修改</button>
                    <button class="btn btn-danger" onclick="removeNote(${note.id})">刪除</button>
                </div>
            </div>
            `;
    }
    if (filterTags !== "全部") {
      if (!note.tags.includes(filterTags)) {
        return;
      }
    }

    notesDiv.innerHTML += `
        <div class="note">
            <h3>${note.title}</h3>
            <div>
              <button class="btn" onclick="getNoteContent(${note.id})">閱覽</button>
              <button class="btn" onclick="setupModifyNote(${note.id})">修改</button>
              <button class="btn btn-danger" onclick="removeNote(${note.id})">刪除</button>
            </div>
        </div>
    `;
  });
}
renderNotes();

const noteListDiv = document.querySelector("#note-list");
const addTagDiv = document.querySelector("#add-tag");
const addNoteDiv = document.querySelector("#add-note");
const searchNoteDiv = document.querySelector("#search-note");

const pages = [noteListDiv, addTagDiv, addNoteDiv, searchNoteDiv];

function changePage(idx) {
  document.querySelector(".active").classList.remove("active");
  pages[idx].classList.add("active");
}

document.querySelectorAll("aside > button").forEach((button, idx) => {
  button.addEventListener("click", () => changePage(idx));
  filterTags = "全部";
});
