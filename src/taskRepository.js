import { Pool } from "pg";

import {
  createDemoTasks,
  createTask,
  moveTask,
  updateTask,
} from "./taskModel.js";

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapRowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
    completedAt: normalizeTimestamp(row.completed_at),
  };
}

export class InMemoryTaskRepository {
  constructor() {
    this.kind = "memory";
    this.tasks = [];
  }

  async init() {}

  async close() {}

  async listTasks() {
    return [...this.tasks];
  }

  async createTask(input) {
    const task = createTask(input);
    this.tasks = [task, ...this.tasks];
    return task;
  }

  async updateTask(id, patch) {
    const current = this.tasks.find((task) => task.id === id);

    if (!current) {
      return null;
    }

    const [next] = updateTask([current], id, patch);
    this.tasks = this.tasks.map((task) => (task.id === id ? next : task));
    return next;
  }

  async moveTask(id, direction) {
    const current = this.tasks.find((task) => task.id === id);

    if (!current) {
      return null;
    }

    const [next] = moveTask([current], id, direction);
    this.tasks = this.tasks.map((task) => (task.id === id ? next : task));
    return next;
  }

  async deleteTask(id) {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.id !== id);
    return this.tasks.length !== before;
  }

  async clearDone() {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.status !== "done");
    return before - this.tasks.length;
  }

  async seedDemo() {
    const tasks = createDemoTasks();
    this.tasks = [...tasks, ...this.tasks];
    return tasks;
  }
}

export class PostgresTaskRepository {
  constructor(connectionString) {
    this.kind = "postgres";
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date DATE NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ NULL
      )
    `);
  }

  async close() {
    await this.pool.end();
  }

  async listTasks() {
    const result = await this.pool.query(`
      SELECT id, title, note, priority, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      ORDER BY updated_at DESC
    `);

    return result.rows.map(mapRowToTask);
  }

  async createTask(input) {
    const task = createTask(input);

    await this.pool.query(
      `
        INSERT INTO tasks (id, title, note, priority, status, due_date, created_at, updated_at, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        task.id,
        task.title,
        task.note,
        task.priority,
        task.status,
        task.dueDate,
        task.createdAt,
        task.updatedAt,
        task.completedAt,
      ],
    );

    return task;
  }

  async getTask(id) {
    const result = await this.pool.query(
      `
        SELECT id, title, note, priority, status, due_date, created_at, updated_at, completed_at
        FROM tasks
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? mapRowToTask(result.rows[0]) : null;
  }

  async updateTask(id, patch) {
    const current = await this.getTask(id);

    if (!current) {
      return null;
    }

    const [next] = updateTask([current], id, patch);

    await this.pool.query(
      `
        UPDATE tasks
        SET title = $2,
            note = $3,
            priority = $4,
            status = $5,
            due_date = $6,
            updated_at = $7,
            completed_at = $8
        WHERE id = $1
      `,
      [
        next.id,
        next.title,
        next.note,
        next.priority,
        next.status,
        next.dueDate,
        next.updatedAt,
        next.completedAt,
      ],
    );

    return next;
  }

  async moveTask(id, direction) {
    const current = await this.getTask(id);

    if (!current) {
      return null;
    }

    const [next] = moveTask([current], id, direction);

    await this.pool.query(
      `
        UPDATE tasks
        SET status = $2,
            updated_at = $3,
            completed_at = $4
        WHERE id = $1
      `,
      [next.id, next.status, next.updatedAt, next.completedAt],
    );

    return next;
  }

  async deleteTask(id) {
    const result = await this.pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return result.rowCount > 0;
  }

  async clearDone() {
    const result = await this.pool.query("DELETE FROM tasks WHERE status = 'done'");
    return result.rowCount;
  }

  async seedDemo() {
    const seededTasks = createDemoTasks();
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const task of seededTasks) {
        await client.query(
          `
            INSERT INTO tasks (id, title, note, priority, status, due_date, created_at, updated_at, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            task.id,
            task.title,
            task.note,
            task.priority,
            task.status,
            task.dueDate,
            task.createdAt,
            task.updatedAt,
            task.completedAt,
          ],
        );
      }

      await client.query("COMMIT");
      return seededTasks;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export async function createTaskRepository() {
  if (!process.env.DATABASE_URL) {
    const repository = new InMemoryTaskRepository();
    await repository.init();
    return repository;
  }

  const repository = new PostgresTaskRepository(process.env.DATABASE_URL);
  await repository.init();
  return repository;
}
