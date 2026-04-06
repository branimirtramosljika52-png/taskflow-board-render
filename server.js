import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

import {
  canDeleteWorkOrders,
  canManageMasterData,
  canManageWorkOrders,
} from "./src/accessControl.js";
import {
  buildDocxFromTemplateBuffer,
  buildPdfFromRenderModel,
  isWordTemplateFile,
  readStoredDocumentBuffer,
  sanitizeGeneratedDocumentFileName,
} from "./src/documentExport.js";
import { createLiveChatStore } from "./src/liveChatStore.js";
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
const liveChatStore = createLiveChatStore();

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

function sendBinary(response, statusCode, body, {
  contentType = "application/octet-stream",
  fileName = "",
} = {}) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  if (fileName) {
    response.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
  }
  response.end(body);
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

async function hydrateRequestUser(userLike) {
  if (!userLike?.id || typeof tenantRepository.getUserById !== "function") {
    return userLike ?? null;
  }

  return await tenantRepository.getUserById(userLike.id);
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

  return hydrateRequestUser(rotated.user);
}

async function getRequestUser(request, response) {
  if (Object.prototype.hasOwnProperty.call(request, requestUserSymbol)) {
    return request[requestUserSymbol];
  }

  const cookies = parseCookies(request.headers.cookie ?? "");
  const accessToken = getAccessTokenFromCookies(cookies);
  const accessVerification = verifyToken(accessToken, jwtSecret, { expectedType: "access" });

  if (accessVerification.ok) {
    const user = await hydrateRequestUser(buildUserFromTokenPayload(accessVerification.payload));
    request[requestUserSymbol] = user;
    return user;
  }

  const refreshedUser = await tryRefreshAuth(request, response, cookies);
  request[requestUserSymbol] = refreshedUser;
  return refreshedUser;
}

async function readRequestBodyText(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return "";
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(request) {
  const body = await readRequestBodyText(request);

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

async function readFormBody(request) {
  const body = await readRequestBodyText(request);

  if (!body) {
    return {};
  }

  const parsed = new URLSearchParams(body);
  const values = {};

  for (const [key, value] of parsed.entries()) {
    values[key] = value;
  }

  return values;
}

function redirect(response, location, statusCode = 303) {
  response.statusCode = statusCode;
  response.setHeader("Location", location);
  response.end();
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

function assertSampleCompanyPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.sampleCompanyId) {
    return;
  }

  assertInScope(scopedSnapshot.companies, body.sampleCompanyId, "Tvrtka nije dostupna za odabrani template.");
}

function assertSampleLocationPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.sampleLocationId) {
    return;
  }

  assertInScope(scopedSnapshot.locations, body.sampleLocationId, "Lokacija nije dostupna za odabrani template.");
}

function assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body = {}) {
  if (!Array.isArray(body.selectedLegalFrameworkIds)) {
    return;
  }

  body.selectedLegalFrameworkIds.forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.legalFrameworks ?? [], id, "Propis nije dostupan za odabranu organizaciju.");
  });
}

function assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body = {}, fieldName = "linkedTemplateIds") {
  if (!Array.isArray(body[fieldName])) {
    return;
  }

  body[fieldName].forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.documentTemplates ?? [], id, "Template nije dostupan za odabranu organizaciju.");
  });
}

function assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body = {}) {
  if (!Array.isArray(body.serviceItems)) {
    return;
  }

  body.serviceItems.forEach((item) => {
    const serviceId = String(item?.serviceId ?? item?.id ?? "").trim();
    if (!serviceId) {
      return;
    }

    assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceId, "Usluga nije dostupna za odabranu organizaciju.");
  });
}

function assertWorkOrderPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.workOrderId) {
    return;
  }

  assertInScope(scopedSnapshot.workOrders, body.workOrderId, "Radni nalog nije dostupan za odabranu organizaciju.");
}

function normalizeInputValue(value) {
  return String(value ?? "").trim();
}

function resolveAssignedUserPayload(scopedSnapshot, body = {}) {
  if (!Object.prototype.hasOwnProperty.call(body, "assignedToUserId")) {
    return {};
  }

  const assignedToUserId = String(body.assignedToUserId ?? "").trim();

  if (!assignedToUserId) {
    return {
      assignedToUserId: "",
      assignedToLabel: "",
    };
  }

  const assignedUser = assertInScope(
    scopedSnapshot.users,
    assignedToUserId,
    "Odabrani kolega nije dostupan za aktivnu organizaciju.",
  );

  return {
    assignedToUserId: String(assignedUser.id),
    assignedToLabel: assignedUser.fullName || assignedUser.email || assignedUser.username || "User",
  };
}

function resolveVehicleReservationUserPayload(scopedSnapshot, body = {}) {
  const hasUserIds = Object.prototype.hasOwnProperty.call(body, "reservedForUserIds");
  const hasLabels = Object.prototype.hasOwnProperty.call(body, "reservedForLabels");
  const hasUserId = Object.prototype.hasOwnProperty.call(body, "reservedForUserId");
  const hasLabel = Object.prototype.hasOwnProperty.call(body, "reservedForLabel");

  if (!hasUserIds && !hasLabels && !hasUserId && !hasLabel) {
    return {};
  }

  if (hasUserIds || hasLabels) {
    const requestedUserIds = Array.isArray(body.reservedForUserIds)
      ? body.reservedForUserIds.map((value) => normalizeInputValue(value)).filter(Boolean)
      : [normalizeInputValue(body.reservedForUserId)].filter(Boolean);
    const uniqueUserIds = Array.from(new Set(requestedUserIds));

    if (uniqueUserIds.length === 0) {
      return {
        reservedForUserIds: [],
        reservedForLabels: hasLabels && Array.isArray(body.reservedForLabels)
          ? body.reservedForLabels.map((value) => normalizeInputValue(value)).filter(Boolean)
          : [],
        reservedForUserId: "",
        reservedForLabel: "",
      };
    }

    const resolvedUsers = uniqueUserIds.map((userId) => assertInScope(
      scopedSnapshot.users,
      userId,
      "Odabrani kolega nije dostupan za aktivnu organizaciju.",
    ));
    const reservedForLabels = resolvedUsers.map((user) => user.fullName || user.email || user.username || "User");

    return {
      reservedForUserIds: resolvedUsers.map((user) => String(user.id)),
      reservedForLabels,
      reservedForUserId: String(resolvedUsers[0]?.id ?? ""),
      reservedForLabel: reservedForLabels.join(", "),
    };
  }

  const reservedForUserId = normalizeInputValue(body.reservedForUserId);

  if (!reservedForUserId) {
    return {
      reservedForUserIds: [],
      reservedForLabels: [],
      reservedForUserId: "",
      reservedForLabel: hasLabel ? normalizeInputValue(body.reservedForLabel) : "",
    };
  }

  const reservedUser = assertInScope(
    scopedSnapshot.users,
    reservedForUserId,
    "Odabrani kolega nije dostupan za aktivnu organizaciju.",
  );

  return {
    reservedForUserIds: [String(reservedUser.id)],
    reservedForLabels: [reservedUser.fullName || reservedUser.email || reservedUser.username || "User"],
    reservedForUserId: String(reservedUser.id),
    reservedForLabel: reservedUser.fullName || reservedUser.email || reservedUser.username || "User",
  };
}

async function writeSnapshot(response, user, request, statusCode = 200) {
  const { scopedSnapshot } = await getScopedState(user, request);
  sendJson(response, statusCode, {
    storage: domainRepository.kind,
    user,
    ...scopedSnapshot,
  });
}

function buildChatUsers(users = []) {
  return (users ?? []).map((entry) => ({
    id: String(entry.id ?? ""),
    fullName: String(entry.fullName ?? [entry.firstName, entry.lastName].filter(Boolean).join(" ")),
    email: String(entry.email ?? ""),
    avatarDataUrl: String(entry.avatarDataUrl ?? ""),
    role: String(entry.role ?? "user"),
    isActive: entry.isActive !== false,
  })).filter((entry) => entry.id);
}

async function getScopedChatContext(user, request) {
  const { scopedSnapshot } = await getScopedState(user, request);
  return {
    organizationId: String(scopedSnapshot.activeOrganizationId ?? ""),
    users: buildChatUsers(scopedSnapshot.users),
  };
}

async function writeChatSnapshot(response, user, request, statusCode = 200) {
  const { organizationId, users } = await getScopedChatContext(user, request);
  sendJson(response, statusCode, liveChatStore.getSnapshot({
    organizationId,
    currentUser: user,
    users,
  }));
}

async function handleEntityMutation(response, user, request, handler, statusCode = 200) {
  await handler();
  await writeSnapshot(response, user, request, statusCode);
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        storage: domainRepository.kind,
        objectStorage: {
          enabled: Boolean(domainRepository.objectStorage?.enabled),
          provider: domainRepository.objectStorage?.provider ?? "",
          bucket: domainRepository.objectStorage?.bucket ?? "",
          region: domainRepository.objectStorage?.region ?? "",
        },
      });
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

    if (request.method === "PATCH" && url.pathname === "/api/auth/profile/avatar") {
      const body = await readJsonBody(request);
      const updatedUser = await tenantRepository.updateOwnAvatar(user, body.avatarDataUrl);

      if (!updatedUser) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      request[requestUserSymbol] = updatedUser;
      await writeSnapshot(response, updatedUser, request);
      return true;
    }

    const organizationMatch = url.pathname.match(/^\/api\/organizations\/([^/]+)$/);
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    const loginContentMatch = url.pathname.match(/^\/api\/login-content\/([^/]+)$/);
    const signupRequestActionMatch = url.pathname.match(/^\/api\/signup-requests\/([^/]+)\/(approve|reject)$/);
    const companyMatch = url.pathname.match(/^\/api\/companies\/([^/]+)$/);
    const locationMatch = url.pathname.match(/^\/api\/locations\/([^/]+)$/);
    const dashboardWidgetMatch = url.pathname.match(/^\/api\/dashboard-widgets\/([^/]+)$/);
    const reminderMatch = url.pathname.match(/^\/api\/reminders\/([^/]+)$/);
    const offerMatch = url.pathname.match(/^\/api\/offers\/([^/]+)$/);
    const legalFrameworkMatch = url.pathname.match(/^\/api\/legal-frameworks\/([^/]+)$/);
    const serviceCatalogMatch = url.pathname.match(/^\/api\/service-catalog\/([^/]+)$/);
    const measurementEquipmentMatch = url.pathname.match(/^\/api\/measurement-equipment\/([^/]+)$/);
    const safetyAuthorizationMatch = url.pathname.match(/^\/api\/safety-authorizations\/([^/]+)$/);
    const documentTemplateMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)$/);
    const documentTemplateWordExportMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)\/export-word$/);
    const documentTemplatePdfExportMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)\/export-pdf$/);
    const vehicleReservationsCollectionMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)\/reservations$/);
    const vehicleReservationMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)\/reservations\/([^/]+)$/);
    const vehicleMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)$/);
    const todoTaskCommentMatch = url.pathname.match(/^\/api\/todo-tasks\/([^/]+)\/comments$/);
    const todoTaskMatch = url.pathname.match(/^\/api\/todo-tasks\/([^/]+)$/);
    const chatConversationMessageMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/messages$/);
    const chatConversationReadMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/read$/);
    const workOrderActivityMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/activity$/);
    const workOrderDocumentsMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents$/);
    const workOrderDocumentMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents\/([^/]+)$/);
    const workOrderMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)$/);

    if (request.method === "GET" && url.pathname === "/api/chat/bootstrap") {
      await writeChatSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/chat/presence") {
      const body = await readJsonBody(request);
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.setPresence({
        organizationId,
        userId: user.id,
        status: body.status,
      });
      await writeChatSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/chat/conversations") {
      const body = await readJsonBody(request);
      const { organizationId, users } = await getScopedChatContext(user, request);
      liveChatStore.createConversation({
        organizationId,
        currentUser: user,
        users,
        title: body.title,
        participantIds: body.participantIds,
      });
      await writeChatSnapshot(response, user, request, 201);
      return true;
    }

    if (chatConversationMessageMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.addMessage({
        organizationId,
        conversationId: chatConversationMessageMatch[1],
        currentUser: user,
        body: body.body,
      });
      await writeChatSnapshot(response, user, request, 201);
      return true;
    }

    if (chatConversationReadMatch && request.method === "POST") {
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.markConversationRead({
        organizationId,
        conversationId: chatConversationReadMatch[1],
        currentUserId: user.id,
      });
      await writeChatSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/organizations") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createOrganization(user, body), 201);
      return true;
    }

    if (organizationMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateOrganization(user, organizationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Organizacija nije pronađena.");
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
        sendError(response, 404, "Korisnik nije pronađen.");
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
        sendError(response, 404, "Login sadržaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (loginContentMatch && request.method === "DELETE") {
      const deleted = await tenantRepository.deleteLoginContent(user, loginContentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Login sadržaj nije pronađen.");
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
      assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createWorkOrder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/reminders") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati reminderima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      await domainRepository.createReminder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/todo-tasks") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ToDo zadacima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const assignedPayload = resolveAssignedUserPayload(scopedSnapshot, body);
      await domainRepository.createTodoTask({
        ...body,
        ...assignedPayload,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/offers") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createOffer({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/vehicles") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati vozilima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createVehicle({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/legal-frameworks") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati propisima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body, "linkedTemplateIds");
      await domainRepository.createLegalFramework({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati mjernom opremom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createMeasurementEquipmentItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/service-catalog") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati uslugama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createServiceCatalogItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/safety-authorizations") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati ovlaštenjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createSafetyAuthorization({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/document-records") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo pregledavati zapisnike.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const templateId = String(url.searchParams.get("templateId") ?? "").trim();
      const companyId = String(url.searchParams.get("companyId") ?? "").trim();
      const locationId = String(url.searchParams.get("locationId") ?? "").trim();
      const limit = String(url.searchParams.get("limit") ?? "12").trim();

      if (templateId) {
        assertInScope(scopedSnapshot.documentTemplates ?? [], templateId, "Template nije dostupan za odabranu organizaciju.");
      }
      if (companyId) {
        assertInScope(scopedSnapshot.companies ?? [], companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      }
      if (locationId) {
        assertInScope(scopedSnapshot.locations ?? [], locationId, "Lokacija nije dostupna za odabranu organizaciju.");
      }

      const items = await domainRepository.listDocumentRecords({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateId,
        companyId,
        locationId,
        limit,
      });

      sendJson(response, 200, { items });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/document-records") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo spremati zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], body.templateId, "Template nije dostupan za odabranu organizaciju.");
      assertInScope(scopedSnapshot.companies ?? [], body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      assertInScope(scopedSnapshot.locations ?? [], body.locationId, "Lokacija nije dostupna za odabranu organizaciju.");

      const item = await domainRepository.createDocumentRecord({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      sendJson(response, 201, { item });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/document-templates") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertSampleCompanyPayloadInScope(scopedSnapshot, body);
      assertSampleLocationPayloadInScope(scopedSnapshot, body);
      assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createDocumentTemplate({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (documentTemplateWordExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati Word zapisnik.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const template = assertInScope(
        scopedSnapshot.documentTemplates ?? [],
        documentTemplateWordExportMatch[1],
        "Template nije pronađen.",
      );

      if (!template.referenceDocument) {
        sendError(response, 400, "Template još nema učitan Word predložak.");
        return true;
      }

      if (!isWordTemplateFile(template.referenceDocument)) {
        sendError(response, 400, "Za Word export učitaj .docx ili .dotx predložak.");
        return true;
      }

      const referenceDocument = await readStoredDocumentBuffer(template.referenceDocument);
      const generatedWord = await buildDocxFromTemplateBuffer(referenceDocument.buffer, body.placeholders ?? {});
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || template.outputFileName || template.title || "zapisnik",
        { fallback: "zapisnik", extension: "docx" },
      );

      sendBinary(response, 200, generatedWord, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName,
      });
      return true;
    }

    if (documentTemplatePdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF zapisnik.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const template = assertInScope(
        scopedSnapshot.documentTemplates ?? [],
        documentTemplatePdfExportMatch[1],
        "Template nije pronađen.",
      );

      const renderModel = body.renderModel && typeof body.renderModel === "object"
        ? body.renderModel
        : {};
      const pdfBuffer = await buildPdfFromRenderModel({
        ...renderModel,
        title: renderModel.title || body.title || template.title || "Zapisnik",
        documentType: renderModel.documentType || template.documentType || "Zapisnik",
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || template.outputFileName || template.title || "zapisnik",
        { fallback: "zapisnik", extension: "pdf" },
      );

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (vehicleReservationsCollectionMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo rezervirati vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationsCollectionMatch[1], "Vozilo nije pronađeno.");
      const reservationUserPayload = resolveVehicleReservationUserPayload(scopedSnapshot, body);
      await domainRepository.createVehicleReservation(vehicle.id, {
        ...body,
        ...reservationUserPayload,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/dashboard-widgets") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createDashboardWidget({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: user.id,
      });
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
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronađena.");
      const updated = await domainRepository.updateCompany(companyMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Tvrtka nije pronađena.");
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
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronađena.");
      const deleted = await domainRepository.deleteCompany(companyMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Tvrtka nije pronađena.");
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
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateLocation(locationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Lokacija nije pronađena.");
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
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronađena.");
      const deleted = await domainRepository.deleteLocation(locationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Lokacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderActivityMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderActivityMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.getWorkOrderActivity(workOrderActivityMatch[1]);
      sendJson(response, 200, { items });
      return true;
    }

    if (workOrderDocumentsMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentsMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.getWorkOrderDocuments(workOrderDocumentsMatch[1]);
      sendJson(response, 200, { items });
      return true;
    }

    if (workOrderDocumentsMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo dodavati dokumente na radne naloge.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentsMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.addWorkOrderDocuments(
        workOrderDocumentsMatch[1],
        body.files ?? [],
        user,
        { sourceType: body.sourceType ?? body.source },
      );
      sendJson(response, 201, { items });
      return true;
    }

    if (workOrderDocumentMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo uredjivati dokumente na radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentMatch[1], "Radni nalog nije pronađen.");
      const item = await domainRepository.updateWorkOrderDocument(
        workOrderDocumentMatch[1],
        workOrderDocumentMatch[2],
        body,
        user,
      );

      if (!item) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      sendJson(response, 200, { item });
      return true;
    }

    if (workOrderDocumentMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati dokumente na radnim nalozima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentMatch[1], "Radni nalog nije pronađen.");
      const deleted = await domainRepository.deleteWorkOrderDocument(
        workOrderDocumentMatch[1],
        workOrderDocumentMatch[2],
        user,
      );

      if (!deleted) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      sendJson(response, 200, { ok: true });
      return true;
    }

    if (workOrderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateWorkOrder(workOrderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Radni nalog nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (reminderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati reminderima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.reminders, reminderMatch[1], "Reminder nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateReminder(reminderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Reminder nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ToDo zadacima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskMatch[1], "ToDo zadatak nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const assignedPayload = resolveAssignedUserPayload(scopedSnapshot, body);
      const updated = await domainRepository.updateTodoTask(todoTaskMatch[1], {
        ...body,
        ...assignedPayload,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.offers, offerMatch[1], "Ponuda nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateOffer(offerMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Ponuda nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati vozilima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.vehicles, vehicleMatch[1], "Vozilo nije pronađeno.");
      const updated = await domainRepository.updateVehicle(vehicleMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Vozilo nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (legalFrameworkMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati propisima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.legalFrameworks ?? [], legalFrameworkMatch[1], "Propis nije pronađen.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body, "linkedTemplateIds");
      const updated = await domainRepository.updateLegalFramework(legalFrameworkMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Propis nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (measurementEquipmentMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati mjernom opremom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.measurementEquipment ?? [], measurementEquipmentMatch[1], "Uređaj nije pronađen.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateMeasurementEquipmentItem(measurementEquipmentMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Uređaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (serviceCatalogMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati uslugama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceCatalogMatch[1], "Usluga nije pronađena.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateServiceCatalogItem(serviceCatalogMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Usluga nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (safetyAuthorizationMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati ovlaštenjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.safetyAuthorizations ?? [], safetyAuthorizationMatch[1], "Ovlaštenje nije pronađeno.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateSafetyAuthorization(safetyAuthorizationMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Ovlaštenje nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (documentTemplateMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], documentTemplateMatch[1], "Template nije pronađen.");
      assertSampleCompanyPayloadInScope(scopedSnapshot, body);
      assertSampleLocationPayloadInScope(scopedSnapshot, body);
      assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateDocumentTemplate(documentTemplateMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Template nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleReservationMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati rezervacijama vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationMatch[1], "Vozilo nije pronađeno.");
      assertInScope(vehicle.reservations ?? [], vehicleReservationMatch[2], "Rezervacija vozila nije pronađena.");
      const reservationUserPayload = resolveVehicleReservationUserPayload(scopedSnapshot, body);
      const updated = await domainRepository.updateVehicleReservation(vehicle.id, vehicleReservationMatch[2], {
        ...body,
        ...reservationUserPayload,
      }, user);

      if (!updated) {
        sendError(response, 404, "Rezervacija vozila nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (dashboardWidgetMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.dashboardWidgets, dashboardWidgetMatch[1], "Dashboard kartica nije pronađena.");
      const updated = await domainRepository.updateDashboardWidget(dashboardWidgetMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: user.id,
      });

      if (!updated) {
        sendError(response, 404, "Dashboard kartica nije pronađena.");
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
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronađen.");
      const deleted = await domainRepository.deleteWorkOrder(workOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Radni nalog nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (reminderMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati remindere.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.reminders, reminderMatch[1], "Reminder nije pronađen.");
      const deleted = await domainRepository.deleteReminder(reminderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Reminder nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskCommentMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo komunicirati kroz ToDo.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskCommentMatch[1], "ToDo zadatak nije pronađen.");
      const updated = await domainRepository.addTodoTaskComment(todoTaskCommentMatch[1], body, user);

      if (!updated) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati ToDo zadatke.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskMatch[1], "ToDo zadatak nije pronađen.");
      const deleted = await domainRepository.deleteTodoTask(todoTaskMatch[1]);

      if (!deleted) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.offers, offerMatch[1], "Ponuda nije pronađena.");
      const deleted = await domainRepository.deleteOffer(offerMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Ponuda nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati vozila.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.vehicles, vehicleMatch[1], "Vozilo nije pronađeno.");
      const deleted = await domainRepository.deleteVehicle(vehicleMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Vozilo nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (legalFrameworkMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati propise.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.legalFrameworks ?? [], legalFrameworkMatch[1], "Propis nije pronađen.");
      const deleted = await domainRepository.deleteLegalFramework(legalFrameworkMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Propis nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (measurementEquipmentMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati mjernu opremu.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.measurementEquipment ?? [], measurementEquipmentMatch[1], "Uređaj nije pronađen.");
      const deleted = await domainRepository.deleteMeasurementEquipmentItem(measurementEquipmentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Uređaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (serviceCatalogMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati usluge.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceCatalogMatch[1], "Usluga nije pronađena.");
      const deleted = await domainRepository.deleteServiceCatalogItem(serviceCatalogMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Usluga nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (safetyAuthorizationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati ovlaštenja.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.safetyAuthorizations ?? [], safetyAuthorizationMatch[1], "Ovlaštenje nije pronađeno.");
      const deleted = await domainRepository.deleteSafetyAuthorization(safetyAuthorizationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Ovlaštenje nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (documentTemplateMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati templatee.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], documentTemplateMatch[1], "Template nije pronađen.");
      const deleted = await domainRepository.deleteDocumentTemplate(documentTemplateMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Template nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleReservationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati rezervacije vozila.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationMatch[1], "Vozilo nije pronađeno.");
      assertInScope(vehicle.reservations ?? [], vehicleReservationMatch[2], "Rezervacija vozila nije pronađena.");
      const deleted = await domainRepository.deleteVehicleReservation(vehicle.id, vehicleReservationMatch[2]);

      if (!deleted) {
        sendError(response, 404, "Rezervacija vozila nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (dashboardWidgetMatch && request.method === "DELETE") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.dashboardWidgets, dashboardWidgetMatch[1], "Dashboard kartica nije pronađena.");
      const deleted = await domainRepository.deleteDashboardWidget(dashboardWidgetMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Dashboard kartica nije pronađena.");
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
  const noStoreHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (!isSafePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      ...noStoreHeaders,
    });
    response.end(file);
  } catch (error) {
    if (pathname !== "/index.html" && !extname(pathname)) {
      const indexFile = await readFile(resolve(staticRoot, "index.html"));
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        ...noStoreHeaders,
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

  if (request.method === "POST" && url.pathname === "/auth/login-form") {
    try {
      const body = await readFormBody(request);
      const user = await tenantRepository.authenticateUser(body.email ?? body.username, body.password);

      if (!user) {
        redirect(response, "/?loginError=invalid");
        return;
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

      redirect(response, "/");
      return;
    } catch (error) {
      console.error("Form login failed.", error);
      redirect(response, "/?loginError=server");
      return;
    }
  }

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
