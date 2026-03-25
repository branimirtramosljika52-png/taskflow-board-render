import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

import { createTaskRepository } from "./src/taskRepository.js";

const port = Number(process.env.PORT || 3000);
const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, "dist");
const staticRoot = existsSync(resolve(distDir, "index.html")) ? distDir : rootDir;

function sleep(durationMs) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, durationMs);
  });
}

async function createRepositoryWithRetry() {
  const attempts = process.env.DATABASE_URL ? 6 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await createTaskRepository();
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      console.warn(`Repository init failed (attempt ${attempt}/${attempts}). Retrying in 2s...`);
      await sleep(2_000);
    }
  }

  throw lastError;
}

const repository = await createRepositoryWithRetry();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const body = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

async function writeTasks(response, statusCode = 200) {
  sendJson(response, statusCode, {
    storage: repository.kind,
    tasks: await repository.listTasks(),
  });
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, storage: repository.kind });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/tasks") {
      await writeTasks(response);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/tasks") {
      const body = await readJsonBody(request);
      await repository.createTask(body);
      await writeTasks(response, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/tasks/demo") {
      await repository.seedDemo();
      await writeTasks(response, 201);
      return true;
    }

    if (request.method === "DELETE" && url.pathname === "/api/tasks" && url.searchParams.get("status") === "done") {
      await repository.clearDone();
      await writeTasks(response);
      return true;
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
    const moveMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/move$/);

    if (moveMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const updated = await repository.moveTask(moveMatch[1], body.direction);

      if (!updated) {
        sendError(response, 404, "Task not found.");
        return true;
      }

      await writeTasks(response);
      return true;
    }

    if (taskMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await repository.updateTask(taskMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Task not found.");
        return true;
      }

      await writeTasks(response);
      return true;
    }

    if (taskMatch && request.method === "DELETE") {
      const deleted = await repository.deleteTask(taskMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Task not found.");
        return true;
      }

      await writeTasks(response);
      return true;
    }
  } catch (error) {
    sendError(response, 400, error.message || "Request failed.");
    return true;
  }

  return false;
}

async function handleStaticRequest(response, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = resolve(staticRoot, `.${pathname}`);
  const isSafePath = filePath === staticRoot || filePath.startsWith(`${staticRoot}${sep}`);

  if (!isSafePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": pathname === "/index.html" ? "no-store" : "public, max-age=300",
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(file);
  } catch (error) {
    if (pathname !== "/index.html" && !extname(pathname)) {
      const indexFile = await readFile(resolve(staticRoot, "index.html"));
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      });
      response.end(indexFile);
      return;
    }

    response.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    const handled = await handleApiRequest(request, response, url);

    if (!handled) {
      sendError(response, 404, "Endpoint not found.");
    }

    return;
  }

  await handleStaticRequest(response, url);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down...`);

  server.close(async () => {
    try {
      await repository.close?.();
      process.exit(0);
    } catch (error) {
      console.error("Failed to close repository cleanly.", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

server.listen(port, () => {
  console.log(`TaskFlow full-stack live at http://localhost:${port} (${repository.kind})`);
});
