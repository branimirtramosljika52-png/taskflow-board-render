import {
  addTask,
  clearDone,
  createDemoTasks,
  deleteTask,
  filterTasks,
  getStats,
  isTaskOverdue,
  moveTask,
  parseTasks,
  serializeTasks,
  sortTasks,
  updateTask,
} from "./taskModel.js";

const STORAGE_KEY = "taskflow-board/tasks";

const form = document.querySelector("#task-form");
const formError = document.querySelector("#form-error");
const titleInput = document.querySelector("#task-title");
const noteInput = document.querySelector("#task-note");
const dueDateInput = document.querySelector("#task-due-date");
const priorityInput = document.querySelector("#task-priority");
const statusInput = document.querySelector("#task-status");

const searchInput = document.querySelector("#search-input");
const filterStatusInput = document.querySelector("#filter-status");
const filterPriorityInput = document.querySelector("#filter-priority");
const clearDoneButton = document.querySelector("#clear-done");
const seedDemoButton = document.querySelector("#seed-demo");

const totalCount = document.querySelector("#total-count");
const doingCount = document.querySelector("#doing-count");
const overdueCount = document.querySelector("#overdue-count");
const doneCount = document.querySelector("#done-count");

const todoList = document.querySelector("#todo-list");
const doingList = document.querySelector("#doing-list");
const doneList = document.querySelector("#done-list");

const todoBadge = document.querySelector("#todo-badge");
const doingBadge = document.querySelector("#doing-badge");
const doneBadge = document.querySelector("#done-badge");
const emptyState = document.querySelector("#empty-state");

const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editError = document.querySelector("#edit-error");
const editIdInput = document.querySelector("#edit-id");
const editTitleInput = document.querySelector("#edit-title");
const editNoteInput = document.querySelector("#edit-note");
const editDueDateInput = document.querySelector("#edit-due-date");
const editPriorityInput = document.querySelector("#edit-priority");
const editStatusInput = document.querySelector("#edit-status");
const closeDialogButton = document.querySelector("#close-dialog");
const cancelEditButton = document.querySelector("#cancel-edit");

let tasks = parseTasks(window.localStorage.getItem(STORAGE_KEY));

function saveTasks() {
  window.localStorage.setItem(STORAGE_KEY, serializeTasks(tasks));
}

function formatDueDate(value) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
}

function renderSummary() {
  const stats = getStats(tasks);
  totalCount.textContent = String(stats.total);
  doingCount.textContent = String(stats.doing);
  overdueCount.textContent = String(stats.overdue);
  doneCount.textContent = String(stats.done);
  clearDoneButton.disabled = stats.done === 0;
}

function getFilters() {
  return {
    search: searchInput.value,
    status: filterStatusInput.value,
    priority: filterPriorityInput.value,
  };
}

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function openEditor(task) {
  editError.textContent = "";
  editIdInput.value = task.id;
  editTitleInput.value = task.title;
  editNoteInput.value = task.note;
  editDueDateInput.value = task.dueDate ?? "";
  editPriorityInput.value = task.priority;
  editStatusInput.value = task.status;
  editDialog.showModal();
}

function closeEditor() {
  editDialog.close();
  editError.textContent = "";
}

function buildTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card${isTaskOverdue(task) ? " is-overdue" : ""}`;

  const top = document.createElement("div");
  top.className = "task-top";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const editButton = createButton("Edit", "card-button", () => openEditor(task));
  top.append(title, editButton);

  const note = document.createElement("p");
  note.className = "task-note";
  note.textContent = task.note || "No extra note.";

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const priorityPill = document.createElement("span");
  priorityPill.className = `pill priority-${task.priority}`;
  priorityPill.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`;

  const dueDatePill = document.createElement("span");
  dueDatePill.className = `pill due-date${isTaskOverdue(task) ? " is-overdue" : ""}`;
  dueDatePill.textContent = formatDueDate(task.dueDate);

  meta.append(priorityPill, dueDatePill);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const shift = document.createElement("div");
  shift.className = "task-shift";

  if (task.status !== "todo") {
    shift.append(
      createButton("Back", "card-button", () => {
        tasks = moveTask(tasks, task.id, "left");
        saveTasks();
        render();
      }),
    );
  }

  if (task.status !== "done") {
    shift.append(
      createButton("Forward", "card-button", () => {
        tasks = moveTask(tasks, task.id, "right");
        saveTasks();
        render();
      }),
    );
  }

  const manage = document.createElement("div");
  manage.className = "task-shift";
  manage.append(
    createButton(task.status === "done" ? "Reopen" : "Done", "card-button", () => {
      tasks = updateTask(tasks, task.id, { status: task.status === "done" ? "todo" : "done" });
      saveTasks();
      render();
    }),
    createButton("Delete", "card-button card-danger", () => {
      tasks = deleteTask(tasks, task.id);
      saveTasks();
      render();
    }),
  );

  actions.append(shift, manage);
  card.append(top, note, meta, actions);

  return card;
}

function renderBoard() {
  const visibleTasks = sortTasks(filterTasks(tasks, getFilters()));
  const columns = {
    todo: [],
    doing: [],
    done: [],
  };

  for (const task of visibleTasks) {
    columns[task.status].push(task);
  }

  todoList.replaceChildren(...columns.todo.map(buildTaskCard));
  doingList.replaceChildren(...columns.doing.map(buildTaskCard));
  doneList.replaceChildren(...columns.done.map(buildTaskCard));

  todoBadge.textContent = String(columns.todo.length);
  doingBadge.textContent = String(columns.doing.length);
  doneBadge.textContent = String(columns.done.length);
  emptyState.hidden = visibleTasks.length !== 0;
}

function render() {
  renderSummary();
  renderBoard();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  try {
    tasks = addTask(tasks, {
      title: titleInput.value,
      note: noteInput.value,
      dueDate: dueDateInput.value,
      priority: priorityInput.value,
      status: statusInput.value,
    });
  } catch (error) {
    formError.textContent = error.message;
    return;
  }

  saveTasks();
  form.reset();
  priorityInput.value = "medium";
  statusInput.value = "todo";
  titleInput.focus();
  render();
});

searchInput.addEventListener("input", render);
filterStatusInput.addEventListener("change", render);
filterPriorityInput.addEventListener("change", render);

clearDoneButton.addEventListener("click", () => {
  tasks = clearDone(tasks);
  saveTasks();
  render();
});

seedDemoButton.addEventListener("click", () => {
  tasks = [...createDemoTasks(), ...tasks];
  saveTasks();
  render();
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  editError.textContent = "";

  try {
    tasks = updateTask(tasks, editIdInput.value, {
      title: editTitleInput.value,
      note: editNoteInput.value,
      dueDate: editDueDateInput.value,
      priority: editPriorityInput.value,
      status: editStatusInput.value,
    });
  } catch (error) {
    editError.textContent = error.message;
    return;
  }

  saveTasks();
  closeEditor();
  render();
});

closeDialogButton.addEventListener("click", closeEditor);
cancelEditButton.addEventListener("click", closeEditor);

render();
