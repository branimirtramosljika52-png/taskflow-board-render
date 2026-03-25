import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

import { createSafetyRepository } from "./src/safetyRepository.js";

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
      return await createSafetyRepository();
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

async function writeSnapshot(response, statusCode = 200) {
  const snapshot = await repository.getSnapshot();
  sendJson(response, statusCode, {
    storage: repository.kind,
    ...snapshot,
  });
}

async function handleEntityMutation(response, handler, statusCode = 200) {
  await handler();
  await writeSnapshot(response, statusCode);
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, storage: repository.kind });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      await writeSnapshot(response);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/companies") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, () => repository.createCompany(body), 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/locations") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, () => repository.createLocation(body), 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/work-orders") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, () => repository.createWorkOrder(body), 201);
      return true;
    }

    const companyMatch = url.pathname.match(/^\/api\/companies\/([^/]+)$/);
    const locationMatch = url.pathname.match(/^\/api\/locations\/([^/]+)$/);
    const workOrderMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)$/);

    if (companyMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await repository.updateCompany(companyMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Tvrtka nije pronadena.");
        return true;
      }

      await writeSnapshot(response);
      return true;
    }

    if (companyMatch && request.method === "DELETE") {
      const deleted = await repository.deleteCompany(companyMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Tvrtka nije pronadena.");
        return true;
      }

      await writeSnapshot(response);
      return true;
    }

    if (locationMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await repository.updateLocation(locationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Lokacija nije pronadena.");
        return true;
      }

      await writeSnapshot(response);
      return true;
    }

    if (locationMatch && request.method === "DELETE") {
      const deleted = await repository.deleteLocation(locationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Lokacija nije pronadena.");
        return true;
      }

      await writeSnapshot(response);
      return true;
    }

    if (workOrderMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await repository.updateWorkOrder(workOrderMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Radni nalog nije pronaden.");
        return true;
      }

      await writeSnapshot(response);
      return true;
    }

    if (workOrderMatch && request.method === "DELETE") {
      const deleted = await repository.deleteWorkOrder(workOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Radni nalog nije pronaden.");
        return true;
      }

      await writeSnapshot(response);
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
  console.log(`SelfDash workspace live at http://localhost:${port} (${repository.kind})`);
});
