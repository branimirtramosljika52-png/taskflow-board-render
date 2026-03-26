import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

import {
  canDeleteWorkOrders,
  canManageMasterData,
  canManageWorkOrders,
} from "./src/accessControl.js";
import { createSafetyRepository } from "./src/safetyRepository.js";
import { createTenantRepository } from "./src/tenantRepository.js";
import {
  clearAuthCookies,
  createAccessToken,
  createAuthCookies,
  createRefreshToken,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  parseCookies,
  resolveJwtSecret,
  verifyToken,
} from "./src/webAuth.js";

const port = Number(process.env.PORT || 3000);
const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, "dist");
const staticRoot = existsSync(resolve(distDir, "index.html")) ? distDir : rootDir;
const requestUserSymbol = Symbol("requestUser");
const jwtSecret = resolveJwtSecret();

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
      const [domainRepository, tenantRepository] = await Promise.all([
        createSafetyRepository(),
        createTenantRepository(),
      ]);

      return {
        domainRepository,
        tenantRepository,
      };
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

const { domainRepository, tenantRepository } = await createRepositoryWithRetry();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function shouldUseSecureCookies(request) {
  const forwardedProto = String(request.headers["x-forwarded-proto"] ?? "").toLowerCase();
  const host = String(request.headers.host ?? "");
  return forwardedProto === "https" || (!host.startsWith("localhost") && !host.startsWith("127.0.0.1"));
}

function getClientIp(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] ?? "");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return String(request.socket.remoteAddress ?? "");
}

function appendResponseCookies(response, cookies) {
  const nextCookies = Array.isArray(cookies) ? cookies.filter(Boolean) : [cookies].filter(Boolean);

  if (nextCookies.length === 0) {
    return;
  }

  const currentHeader = response.getHeader("Set-Cookie");
  const currentCookies = Array.isArray(currentHeader)
    ? currentHeader
    : currentHeader
      ? [currentHeader]
      : [];

  response.setHeader("Set-Cookie", [...currentCookies, ...nextCookies]);
}

function buildUserFromTokenPayload(payload) {
  if (!payload?.sub) {
    return null;
  }

  return {
    id: String(payload.sub),
    username: String(payload.username ?? ""),
    email: String(payload.email ?? ""),
    fullName: String(payload.fullName ?? payload.username ?? ""),
    role: String(payload.role ?? "user"),
    organizationId: payload.organizationId ? String(payload.organizationId) : "",
    organizationName: String(payload.organizationName ?? ""),
  };
}

async function clearRequestAuth(request, response) {
  const cookies = parseCookies(request.headers.cookie ?? "");
  const refreshToken = getRefreshTokenFromCookies(cookies);

  if (refreshToken) {
    await tenantRepository.deleteRefreshToken(refreshToken);
  }

  appendResponseCookies(response, clearAuthCookies({
    secure: shouldUseSecureCookies(request),
  }));
  request[requestUserSymbol] = null;
}

async function tryRefreshAuth(request, response, cookies) {
  const refreshToken = getRefreshTokenFromCookies(cookies);

  if (!refreshToken) {
    return null;
  }

  const refreshVerification = verifyToken(refreshToken, jwtSecret, { expectedType: "refresh" });

  if (!refreshVerification.ok) {
    await clearRequestAuth(request, response);
    return null;
  }

  const provisionalUser = buildUserFromTokenPayload(refreshVerification.payload);

  if (!provisionalUser) {
    await clearRequestAuth(request, response);
    return null;
  }

  const nextAccessToken = createAccessToken(provisionalUser, jwtSecret);
  const nextRefreshToken = createRefreshToken(provisionalUser, jwtSecret);
  const rotated = await tenantRepository.rotateRefreshToken(refreshToken, nextRefreshToken, {
    expectedUserId: provisionalUser.id,
    ipAddress: getClientIp(request),
    userAgent: request.headers["user-agent"] ?? "",
  });

  if (!rotated?.user) {
    await clearRequestAuth(request, response);
    return null;
  }

  appendResponseCookies(response, createAuthCookies({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    secure: shouldUseSecureCookies(request),
  }));

  return rotated.user;
}

async function getRequestUser(request, response) {
  if (Object.prototype.hasOwnProperty.call(request, requestUserSymbol)) {
    return request[requestUserSymbol];
  }

  const cookies = parseCookies(request.headers.cookie ?? "");
  const accessToken = getAccessTokenFromCookies(cookies);
  const accessVerification = verifyToken(accessToken, jwtSecret, { expectedType: "access" });

  if (accessVerification.ok) {
    const user = buildUserFromTokenPayload(accessVerification.payload);
    request[requestUserSymbol] = user;
    return user;
  }

  const refreshedUser = await tryRefreshAuth(request, response, cookies);
  request[requestUserSymbol] = refreshedUser;
  return refreshedUser;
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

function getRequestedOrganizationId(request) {
  return String(request.headers["x-organization-id"] ?? "").trim();
}

async function getScopedState(user, request) {
  const requestedOrganizationId = getRequestedOrganizationId(request);
  const rawSnapshot = await domainRepository.getSnapshot();
  const scopedSnapshot = await tenantRepository.getSnapshot(user, requestedOrganizationId, rawSnapshot);

  return {
    requestedOrganizationId,
    rawSnapshot,
    scopedSnapshot,
  };
}

function assertInScope(collection, id, message) {
  const item = collection.find((entry) => String(entry.id) === String(id));

  if (!item) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }

  return item;
}

function assertCompanyPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.companyId) {
    return;
  }

  assertInScope(scopedSnapshot.companies, body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
}

function assertLocationPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.locationId) {
    return;
  }

  assertInScope(scopedSnapshot.locations, body.locationId, "Lokacija nije dostupna za odabranu organizaciju.");
}

async function writeSnapshot(response, user, request, statusCode = 200) {
  const { scopedSnapshot } = await getScopedState(user, request);
  sendJson(response, statusCode, {
    storage: domainRepository.kind,
    user,
    ...scopedSnapshot,
  });
}

async function handleEntityMutation(response, user, request, handler, statusCode = 200) {
  await handler();
  await writeSnapshot(response, user, request, statusCode);
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, storage: domainRepository.kind });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/login-content") {
      const content = await tenantRepository.getPublicLoginScreen();
      sendJson(response, 200, content);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      const user = await getRequestUser(request, response);
      sendJson(response, 200, {
        authenticated: Boolean(user),
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJsonBody(request);
      const user = await tenantRepository.authenticateUser(body.email ?? body.username, body.password);

      if (!user) {
        sendError(response, 401, "Neispravan email ili lozinka.");
        return true;
      }

      const accessToken = createAccessToken(user, jwtSecret);
      const refreshToken = createRefreshToken(user, jwtSecret);

      await tenantRepository.storeRefreshToken(user, refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: request.headers["user-agent"] ?? "",
      });

      appendResponseCookies(response, createAuthCookies({
        accessToken,
        refreshToken,
        secure: shouldUseSecureCookies(request),
      }));

      sendJson(response, 200, {
        authenticated: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readJsonBody(request);
      const result = await tenantRepository.submitSignupRequest(body);
      sendJson(response, 201, result);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/refresh") {
      const user = await getRequestUser(request, response);

      if (!user) {
        sendError(response, 401, "Prijava je istekla.");
        return true;
      }

      sendJson(response, 200, {
        authenticated: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const cookies = parseCookies(request.headers.cookie ?? "");
      const token = getRefreshTokenFromCookies(cookies);

      if (token) {
        await tenantRepository.deleteRefreshToken(token);
      }

      appendResponseCookies(response, clearAuthCookies({
        secure: shouldUseSecureCookies(request),
      }));
      request[requestUserSymbol] = null;
      sendJson(response, 200, { ok: true });
      return true;
    }

    const user = await getRequestUser(request, response);

    if (!user) {
      sendError(response, 401, "Prijava je potrebna.");
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      await writeSnapshot(response, user, request);
      return true;
    }

    const organizationMatch = url.pathname.match(/^\/api\/organizations\/([^/]+)$/);
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    const loginContentMatch = url.pathname.match(/^\/api\/login-content\/([^/]+)$/);
    const signupRequestActionMatch = url.pathname.match(/^\/api\/signup-requests\/([^/]+)\/(approve|reject)$/);
    const companyMatch = url.pathname.match(/^\/api\/companies\/([^/]+)$/);
    const locationMatch = url.pathname.match(/^\/api\/locations\/([^/]+)$/);
    const workOrderMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)$/);

    if (request.method === "POST" && url.pathname === "/api/organizations") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createOrganization(user, body), 201);
      return true;
    }

    if (organizationMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateOrganization(user, organizationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Organizacija nije pronadena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/users") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createUser(user, body), 201);
      return true;
    }

    if (userMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateUser(user, userMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Korisnik nije pronaden.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/login-content") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createLoginContent(user, body), 201);
      return true;
    }

    if (loginContentMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateLoginContent(user, loginContentMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Login sadrzaj nije pronaden.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (loginContentMatch && request.method === "DELETE") {
      const deleted = await tenantRepository.deleteLoginContent(user, loginContentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Login sadrzaj nije pronaden.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (signupRequestActionMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const [, signupRequestId, action] = signupRequestActionMatch;

      if (action === "approve") {
        await handleEntityMutation(
          response,
          user,
          request,
          () => tenantRepository.approveSignupRequest(user, signupRequestId, body),
        );
        return true;
      }

      if (action === "reject") {
        await handleEntityMutation(
          response,
          user,
          request,
          () => tenantRepository.rejectSignupRequest(user, signupRequestId, body),
        );
        return true;
      }
    }

    if (request.method === "POST" && url.pathname === "/api/companies") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const company = await domainRepository.createCompany(body);
      await tenantRepository.assignCompanyToOrganization(scopedSnapshot.activeOrganizationId, company.id);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/locations") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      await domainRepository.createLocation(body);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/work-orders") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createWorkOrder(body);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (companyMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronadena.");
      const updated = await domainRepository.updateCompany(companyMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Tvrtka nije pronadena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (companyMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronadena.");
      const deleted = await domainRepository.deleteCompany(companyMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Tvrtka nije pronadena.");
        return true;
      }

      await tenantRepository.removeCompanyAssignment(companyMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (locationMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronadena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateLocation(locationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Lokacija nije pronadena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (locationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronadena.");
      const deleted = await domainRepository.deleteLocation(locationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Lokacija nije pronadena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronaden.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateWorkOrder(workOrderMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Radni nalog nije pronaden.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderMatch && request.method === "DELETE") {
      if (!canDeleteWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati radne naloge.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronaden.");
      const deleted = await domainRepository.deleteWorkOrder(workOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Radni nalog nije pronaden.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }
  } catch (error) {
    sendError(response, error.statusCode ?? 400, error.message || "Request failed.");
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
    const extension = extname(filePath);
    response.writeHead(200, {
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=300",
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
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
      await Promise.all([
        domainRepository.close?.(),
        tenantRepository.close?.(),
      ]);
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
  console.log(`SelfDash workspace live at http://localhost:${port} (${domainRepository.kind})`);
});
