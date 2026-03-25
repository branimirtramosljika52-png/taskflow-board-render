import assert from "node:assert/strict";
import test from "node:test";

import {
  addTask,
  clearDone,
  createDemoTasks,
  createTask,
  filterTasks,
  getStats,
  isTaskOverdue,
  moveTask,
  parseTasks,
  sortTasks,
  updateTask,
} from "../src/taskModel.js";

test("createTask validates and normalizes fields", () => {
  const task = createTask(
    {
      title: "  Prepare launch  ",
      note: "  Final review  ",
      priority: "high",
      status: "doing",
      dueDate: "2026-03-30",
    },
    () => "task-1",
    () => "2026-03-24T10:00:00.000Z",
  );

  assert.deepEqual(task, {
    id: "task-1",
    title: "Prepare launch",
    note: "Final review",
    priority: "high",
    status: "doing",
    dueDate: "2026-03-30",
    createdAt: "2026-03-24T10:00:00.000Z",
    updatedAt: "2026-03-24T10:00:00.000Z",
    completedAt: null,
  });

  assert.throws(() => createTask({ title: "   " }, () => "x", () => "now"));
});

test("addTask prepends items and updateTask handles completion state", () => {
  const added = addTask([], { title: "Spec review", status: "todo", priority: "medium" }, () => "1", () => "a");
  const done = updateTask(added, "1", { status: "done" }, () => "b");
  const reopened = updateTask(done, "1", { status: "todo" }, () => "c");

  assert.equal(added[0].id, "1");
  assert.equal(done[0].completedAt, "b");
  assert.equal(reopened[0].completedAt, null);
});

test("moveTask shifts tasks across the board columns", () => {
  const tasks = [
    {
      id: "1",
      title: "Task",
      note: "",
      priority: "medium",
      status: "todo",
      dueDate: null,
      createdAt: "a",
      updatedAt: "a",
      completedAt: null,
    },
  ];

  const moved = moveTask(tasks, "1", "right", () => "b");
  const finished = moveTask(moved, "1", "right", () => "c");

  assert.equal(moved[0].status, "doing");
  assert.equal(finished[0].status, "done");
  assert.equal(finished[0].completedAt, "c");
});

test("filterTasks and sortTasks apply search, status, priority, and due-date ordering", () => {
  const tasks = [
    {
      id: "1",
      title: "Write docs",
      note: "Internal wiki",
      priority: "low",
      status: "todo",
      dueDate: null,
      createdAt: "a",
      updatedAt: "2026-03-24T09:00:00.000Z",
      completedAt: null,
    },
    {
      id: "2",
      title: "Client follow-up",
      note: "Important",
      priority: "high",
      status: "todo",
      dueDate: "2026-03-24",
      createdAt: "a",
      updatedAt: "2026-03-24T10:00:00.000Z",
      completedAt: null,
    },
  ];

  assert.equal(filterTasks(tasks, { search: "wiki" }).length, 1);
  assert.equal(filterTasks(tasks, { status: "todo", priority: "high" }).length, 1);
  assert.equal(sortTasks(tasks)[0].id, "2");
});

test("getStats and isTaskOverdue report overdue work correctly", () => {
  const tasks = [
    {
      id: "1",
      title: "Overdue",
      note: "",
      priority: "high",
      status: "doing",
      dueDate: "2026-03-23",
      createdAt: "a",
      updatedAt: "a",
      completedAt: null,
    },
    {
      id: "2",
      title: "Done",
      note: "",
      priority: "medium",
      status: "done",
      dueDate: "2026-03-20",
      createdAt: "a",
      updatedAt: "a",
      completedAt: "b",
    },
  ];

  assert.equal(isTaskOverdue(tasks[0], "2026-03-24"), true);
  assert.deepEqual(getStats(tasks, "2026-03-24"), {
    total: 2,
    doing: 1,
    overdue: 1,
    done: 1,
  });
});

test("clearDone removes completed tasks and parseTasks normalizes stored data", () => {
  const tasks = [
    {
      id: "1",
      title: "A",
      note: "",
      priority: "high",
      status: "done",
      dueDate: null,
      createdAt: "a",
      updatedAt: "a",
      completedAt: "b",
    },
    {
      id: "2",
      title: "B",
      note: "",
      priority: "medium",
      status: "todo",
      dueDate: null,
      createdAt: "a",
      updatedAt: "a",
      completedAt: null,
    },
  ];

  assert.deepEqual(clearDone(tasks), [tasks[1]]);
  assert.deepEqual(parseTasks("not-json"), []);
  assert.deepEqual(
    parseTasks('[{"id":"1","title":"Stored","priority":"high","status":"doing","note":"x"}]'),
    [
      {
        id: "1",
        title: "Stored",
        note: "x",
        priority: "high",
        status: "doing",
        dueDate: null,
        createdAt: null,
        updatedAt: "",
        completedAt: null,
      },
    ],
  );
});

test("createDemoTasks returns a starter board", () => {
  const tasks = createDemoTasks("2026-03-24");

  assert.equal(tasks.length, 4);
  assert.ok(tasks.some((task) => task.status === "todo"));
  assert.ok(tasks.some((task) => task.status === "doing"));
  assert.ok(tasks.some((task) => task.status === "done"));
});
