import {
  filterTasks,
  getStats,
  isTaskOverdue,
  sortTasks,
} from "./taskModel.js";

const API_BASE = "/api";

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
const connectionStatus = document.querySelector("#connection-status");
const syncError = document.querySelector("#sync-error");

let tasks = [];
let storageMode = "memory";

function setConnectionStatus() {
  if (storageMode === "postgres") {
    connectionStatus.textContent = "Connected to Postgres-backed API";
    connectionStatus.classList.remove("is-memory");
    return;
  }

  connectionStatus.textContent = "Using temporary in-memory backend until DATABASE_URL is configured";
  connectionStatus.classList.add("is-memory");
}

function setSyncError(message = "") {
  syncError.hidden = !message;
  syncError.textContent = message;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

async function refreshTasks() {
  const payload = await apiRequest("/tasks");
  tasks = payload.tasks;
  storageMode = payload.storage;
  setConnectionStatus();
  setSyncError("");
  render();
}

async function runMutation(callback, onError) {
  try {
    const payload = await callback();
    tasks = payload.tasks;
    storageMode = payload.storage;
    setConnectionStatus();
    setSyncError("");
    render();
  } catch (error) {
    if (onError) {
      onError.textContent = error.message;
    } else {
      setSyncError(error.message);
    }
  }
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
        void runMutation(() => apiRequest(`/tasks/${task.id}/move`, {
          method: "POST",
          body: { direction: "left" },
        }));
      }),
    );
  }

  if (task.status !== "done") {
    shift.append(
      createButton("Forward", "card-button", () => {
        void runMutation(() => apiRequest(`/tasks/${task.id}/move`, {
          method: "POST",
          body: { direction: "right" },
        }));
      }),
    );
  }

  const manage = document.createElement("div");
  manage.className = "task-shift";
  manage.append(
    createButton(task.status === "done" ? "Reopen" : "Done", "card-button", () => {
      void runMutation(() => apiRequest(`/tasks/${task.id}`, {
        method: "PATCH",
        body: { status: task.status === "done" ? "todo" : "done" },
      }));
    }),
    createButton("Delete", "card-button card-danger", () => {
      void runMutation(() => apiRequest(`/tasks/${task.id}`, { method: "DELETE" }));
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

  void runMutation(
    () => apiRequest("/tasks", {
      method: "POST",
      body: {
        title: titleInput.value,
        note: noteInput.value,
        dueDate: dueDateInput.value,
        priority: priorityInput.value,
        status: statusInput.value,
      },
    }),
    formError,
  ).then(() => {
    if (!formError.textContent) {
      form.reset();
      priorityInput.value = "medium";
      statusInput.value = "todo";
      titleInput.focus();
    }
  });
});

searchInput.addEventListener("input", render);
filterStatusInput.addEventListener("change", render);
filterPriorityInput.addEventListener("change", render);

clearDoneButton.addEventListener("click", () => {
  void runMutation(() => apiRequest("/tasks?status=done", { method: "DELETE" }));
});

seedDemoButton.addEventListener("click", () => {
  void runMutation(() => apiRequest("/tasks/demo", { method: "POST" }));
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  editError.textContent = "";

  void runMutation(
    () => apiRequest(`/tasks/${editIdInput.value}`, {
      method: "PATCH",
      body: {
        title: editTitleInput.value,
        note: editNoteInput.value,
        dueDate: editDueDateInput.value,
        priority: editPriorityInput.value,
        status: editStatusInput.value,
      },
    }),
    editError,
  ).then(() => {
    if (!editError.textContent) {
      closeEditor();
    }
  });
});

closeDialogButton.addEventListener("click", closeEditor);
cancelEditButton.addEventListener("click", closeEditor);

setConnectionStatus();
render();

refreshTasks().catch((error) => {
  setSyncError(error.message);
  connectionStatus.textContent = "Backend unavailable";
  connectionStatus.classList.add("is-memory");
});
