import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryTaskRepository } from "../src/taskRepository.js";

test("InMemoryTaskRepository supports CRUD, move, and clear-done flows", async () => {
  const repository = new InMemoryTaskRepository();

  await repository.init();

  const created = await repository.createTask({
    title: "Backend integration",
    note: "Wire task board to API",
    priority: "high",
    status: "todo",
    dueDate: "2026-03-26",
  });

  assert.equal((await repository.listTasks()).length, 1);
  assert.equal(created.status, "todo");

  const moved = await repository.moveTask(created.id, "right");
  assert.equal(moved.status, "doing");

  const updated = await repository.updateTask(created.id, {
    title: "Backend integration done",
    status: "done",
  });
  assert.equal(updated.title, "Backend integration done");
  assert.equal(updated.status, "done");
  assert.ok(updated.completedAt);

  const cleared = await repository.clearDone();
  assert.equal(cleared, 1);
  assert.equal((await repository.listTasks()).length, 0);
});

test("InMemoryTaskRepository can seed demo data and delete a task", async () => {
  const repository = new InMemoryTaskRepository();

  await repository.init();
  const seeded = await repository.seedDemo();

  assert.equal(seeded.length, 4);

  const deleted = await repository.deleteTask(seeded[0].id);

  assert.equal(deleted, true);
  assert.equal((await repository.listTasks()).length, 3);
});
