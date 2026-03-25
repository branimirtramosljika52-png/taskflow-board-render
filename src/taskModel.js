export const STATUS_ORDER = ["todo", "doing", "done"];
export const PRIORITY_ORDER = ["high", "medium", "low"];

const STATUS_SET = new Set(STATUS_ORDER);
const PRIORITY_SET = new Set(PRIORITY_ORDER);
const PRIORITY_RANK = {
  high: 0,
  medium: 1,
  low: 2,
};

function isoNow() {
  return new Date().toISOString();
}

function todayString() {
  return isoNow().slice(0, 10);
}

function normalizeTitle(value) {
  const title = String(value ?? "").trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  return title;
}

function normalizeNote(value) {
  return String(value ?? "").trim();
}

function normalizeStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();
  return STATUS_SET.has(status) ? status : "todo";
}

function normalizePriority(value) {
  const priority = String(value ?? "").trim().toLowerCase();
  return PRIORITY_SET.has(priority) ? priority : "medium";
}

function normalizeDueDate(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function isTaskOverdue(task, today = todayString()) {
  return Boolean(task.dueDate && task.status !== "done" && task.dueDate < today);
}

export function createTask(
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const status = normalizeStatus(input.status);

  return {
    id: createId(),
    title: normalizeTitle(input.title),
    note: normalizeNote(input.note),
    priority: normalizePriority(input.priority),
    status,
    dueDate: normalizeDueDate(input.dueDate),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: status === "done" ? timestamp : null,
  };
}

export function addTask(tasks, input, createId, now) {
  return [createTask(input, createId, now), ...tasks];
}

export function updateTask(tasks, id, patch, now = isoNow) {
  const timestamp = now();

  return tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }

    const nextStatus = Object.prototype.hasOwnProperty.call(patch, "status")
      ? normalizeStatus(patch.status)
      : task.status;

    return {
      ...task,
      title: Object.prototype.hasOwnProperty.call(patch, "title")
        ? normalizeTitle(patch.title)
        : task.title,
      note: Object.prototype.hasOwnProperty.call(patch, "note")
        ? normalizeNote(patch.note)
        : task.note,
      priority: Object.prototype.hasOwnProperty.call(patch, "priority")
        ? normalizePriority(patch.priority)
        : task.priority,
      dueDate: Object.prototype.hasOwnProperty.call(patch, "dueDate")
        ? normalizeDueDate(patch.dueDate)
        : task.dueDate,
      status: nextStatus,
      updatedAt: timestamp,
      completedAt: nextStatus === "done" ? task.completedAt ?? timestamp : null,
    };
  });
}

export function moveTask(tasks, id, direction, now = isoNow) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return tasks;
  }

  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const offset = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const nextIndex = Math.min(Math.max(currentIndex + offset, 0), STATUS_ORDER.length - 1);

  if (nextIndex === currentIndex) {
    return tasks;
  }

  return updateTask(tasks, id, { status: STATUS_ORDER[nextIndex] }, now);
}

export function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function clearDone(tasks) {
  return tasks.filter((task) => task.status !== "done");
}

export function filterTasks(tasks, { search = "", status = "all", priority = "all" } = {}) {
  const searchText = String(search ?? "").trim().toLowerCase();

  return tasks.filter((task) => {
    if (status !== "all" && task.status !== status) {
      return false;
    }

    if (priority !== "all" && task.priority !== priority) {
      return false;
    }

    if (!searchText) {
      return true;
    }

    return `${task.title} ${task.note}`.toLowerCase().includes(searchText);
  });
}

export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (a.dueDate && !b.dueDate) {
      return -1;
    }

    if (!a.dueDate && b.dueDate) {
      return 1;
    }

    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function getStats(tasks, today = todayString()) {
  const done = tasks.filter((task) => task.status === "done").length;
  const doing = tasks.filter((task) => task.status === "doing").length;
  const overdue = tasks.filter((task) => isTaskOverdue(task, today)).length;

  return {
    total: tasks.length,
    doing,
    overdue,
    done,
  };
}

export function serializeTasks(tasks) {
  return JSON.stringify(tasks);
}

export function parseTasks(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
      .map((task) => ({
        id: task.id,
        title: normalizeTitle(task.title),
        note: normalizeNote(task.note),
        priority: normalizePriority(task.priority),
        status: normalizeStatus(task.status),
        dueDate: normalizeDueDate(task.dueDate),
        createdAt: typeof task.createdAt === "string" ? task.createdAt : null,
        updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : (typeof task.createdAt === "string" ? task.createdAt : ""),
        completedAt: typeof task.completedAt === "string" ? task.completedAt : null,
      }));
  } catch {
    return [];
  }
}

export function createDemoTasks(baseDate = todayString()) {
  const base = new Date(`${baseDate}T12:00:00`);

  function shift(days) {
    const date = new Date(base);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  return [
    createTask({
      title: "Prepare sprint review",
      note: "Collect highlights from design, backend, and QA before the 4 PM sync.",
      dueDate: shift(1),
      priority: "high",
      status: "todo",
    }),
    createTask({
      title: "Refine onboarding copy",
      note: "Tighten the empty-state messaging and finalize the tooltip text.",
      dueDate: shift(0),
      priority: "medium",
      status: "doing",
    }),
    createTask({
      title: "Invoice March retainer",
      note: "Send invoice and confirm receipt with accounting.",
      dueDate: shift(-1),
      priority: "high",
      status: "doing",
    }),
    createTask({
      title: "Publish release notes",
      note: "Share changelog with the client team and internal support channel.",
      dueDate: shift(-2),
      priority: "low",
      status: "done",
    }),
  ];
}
