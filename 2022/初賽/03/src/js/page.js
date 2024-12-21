const noteList = document.querySelector("#note-list");
const addTag = document.querySelector("#add-tag");
const addNote = document.querySelector("#add-note");
const searchNote = document.querySelector("#search-note");

const pages = [noteList, addTag, addNote, searchNote];

document.querySelectorAll("aside > button").forEach((button, idx) => {
  button.addEventListener("click", () => {
    document.querySelector(".active").classList.remove("active");
    pages[idx].classList.add("active");
  });
});
