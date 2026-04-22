import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const ACCESS_TOKEN_COOKIE_NAME = "safety360_access";
export const REFRESH_TOKEN_COOKIE_NAME = "safety360_refresh";
const DEFAULT_ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 15;
const DEFAULT_REFRESH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_REFRESH_TOKEN_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;

function resolveDurationMs(name, fallbackMs, minimumMs = 1000) {
  const rawValue = String(process?.env?.[name] ?? "").trim();

  if (!rawValue) {
    return fallbackMs;
  }

  const numericValue = Number(rawValue);

  if (!Number.isFinite(numericValue) || numericValue < minimumMs) {
    return fallbackMs;
  }

  return Math.floor(numericValue);
}

export const ACCESS_TOKEN_MAX_AGE_MS = resolveDurationMs("AUTH_ACCESS_TOKEN_MAX_AGE_MS", DEFAULT_ACCESS_TOKEN_MAX_AGE_MS);
export const REFRESH_TOKEN_MAX_AGE_MS = resolveDurationMs("AUTH_REFRESH_TOKEN_MAX_AGE_MS", DEFAULT_REFRESH_TOKEN_MAX_AGE_MS);
export const REFRESH_TOKEN_SESSION_MAX_AGE_MS = resolveDurationMs(
  "AUTH_REFRESH_SESSION_MAX_AGE_MS",
  DEFAULT_REFRESH_TOKEN_SESSION_MAX_AGE_MS,
  ACCESS_TOKEN_MAX_AGE_MS,
);

function toBuffer(value) {
  return Buffer.from(String(value ?? ""), "utf8");
}

function safeCompareText(left, right) {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecodeJson(value) {
  const normalized = String(value ?? "");

  if (!normalized) {
    throw new Error("Missing token segment.");
  }

  return JSON.parse(Buffer.from(normalized, "base64url").toString("utf8"));
}

function normalizeCookieDomain(value = "") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\.+/, "");

  if (!normalized || normalized.includes("/") || normalized.includes(" ")) {
    return "";
  }

  return normalized;
}

function createTokenCookie(name, token, { secure = false, maxAgeMs, domain = "" } = {}) {
  const maxAge = Math.max(0, Math.floor((maxAgeMs ?? 0) / 1000));
  const parts = [
    `${name}=${encodeURIComponent(String(token ?? ""))}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  const normalizedDomain = normalizeCookieDomain(domain);
  if (normalizedDomain) {
    parts.push(`Domain=${normalizedDomain}`);
  }

  return parts.join("; ");
}

function createJwt(payload, secret) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

function normalizeSecret(secret) {
  return String(secret ?? "").trim();
}

function buildTokenPayload(user, type, expiresInMs) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + Math.floor(expiresInMs / 1000);

  return {
    iss: "safety360-web",
    aud: "selfdash-workspace",
    sub: String(user.id),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    organizationId: user.organizationId ?? null,
    organizationName: user.organizationName ?? "",
    type,
    iat: issuedAt,
    exp: expiresAt,
    jti: randomBytes(24).toString("hex"),
  };
}

export async function createPasswordHash(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = await scrypt(String(password ?? ""), salt, 64);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedValue) {
  const normalized = String(storedValue ?? "");

  if (!normalized) {
    return { ok: false, needsUpgrade: false };
  }

  if (normalized.startsWith("scrypt$")) {
    const [, salt, hashHex] = normalized.split("$");

    if (!salt || !hashHex) {
      return { ok: false, needsUpgrade: false };
    }

    const derivedKey = await scrypt(String(password ?? ""), salt, 64);
    const left = Buffer.from(hashHex, "hex");
    const right = Buffer.from(derivedKey);

    if (left.length !== right.length) {
      return { ok: false, needsUpgrade: false };
    }

    return {
      ok: timingSafeEqual(left, right),
      needsUpgrade: false,
    };
  }

  return {
    ok: safeCompareText(password, normalized),
    needsUpgrade: true,
  };
}

export function parseCookies(headerValue = "") {
  return String(headerValue)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const separatorIndex = pair.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = decodeURIComponent(pair.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(pair.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

export function hashStoredToken(token) {
  return createHash("sha256").update(String(token ?? ""), "utf8").digest("hex");
}

export function hashSessionToken(token) {
  return hashStoredToken(token);
}

export function createAccessToken(user, secret, maxAgeMs = ACCESS_TOKEN_MAX_AGE_MS) {
  return createJwt(buildTokenPayload(user, "access", maxAgeMs), normalizeSecret(secret));
}

export function createRefreshToken(user, secret, maxAgeMs = REFRESH_TOKEN_MAX_AGE_MS) {
  return createJwt(buildTokenPayload(user, "refresh", maxAgeMs), normalizeSecret(secret));
}

export function verifyToken(token, secret, { expectedType } = {}) {
  const normalizedToken = String(token ?? "").trim();
  const normalizedSecret = normalizeSecret(secret);

  if (!normalizedToken || !normalizedSecret) {
    return { ok: false, expired: false, payload: null };
  }

  const segments = normalizedToken.split(".");

  if (segments.length !== 3) {
    return { ok: false, expired: false, payload: null };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", normalizedSecret).update(signingInput).digest("base64url");
  const actualBuffer = Buffer.from(encodedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return { ok: false, expired: false, payload: null };
  }

  let header;
  let payload;

  try {
    header = base64UrlDecodeJson(encodedHeader);
    payload = base64UrlDecodeJson(encodedPayload);
  } catch {
    return { ok: false, expired: false, payload: null };
  }

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    return { ok: false, expired: false, payload: null };
  }

  if (expectedType && payload.type !== expectedType) {
    return { ok: false, expired: false, payload: null };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === "number" && nowSeconds >= payload.exp) {
    return { ok: false, expired: true, payload: null };
  }

  if (typeof payload.nbf === "number" && nowSeconds < payload.nbf) {
    return { ok: false, expired: false, payload: null };
  }

  return {
    ok: true,
    expired: false,
    payload,
  };
}

export function createAuthCookies({
  accessToken,
  refreshToken,
  secure = false,
  domain = "",
} = {}) {
  const normalizedDomain = normalizeCookieDomain(domain);
  const cookies = [
    createTokenCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      secure,
      maxAgeMs: ACCESS_TOKEN_MAX_AGE_MS,
      domain: normalizedDomain,
    }),
    createTokenCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      secure,
      maxAgeMs: REFRESH_TOKEN_MAX_AGE_MS,
      domain: normalizedDomain,
    }),
  ];

  if (normalizedDomain) {
    cookies.push(
      createTokenCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        secure,
        maxAgeMs: ACCESS_TOKEN_MAX_AGE_MS,
      }),
      createTokenCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        secure,
        maxAgeMs: REFRESH_TOKEN_MAX_AGE_MS,
      }),
    );
  }

  return cookies;
}

export function clearAuthCookies({ secure = false, domain = "" } = {}) {
  const normalizedDomain = normalizeCookieDomain(domain);
  const cookies = [
    createTokenCookie(ACCESS_TOKEN_COOKIE_NAME, "", {
      secure,
      maxAgeMs: 0,
      domain: normalizedDomain,
    }),
    createTokenCookie(REFRESH_TOKEN_COOKIE_NAME, "", {
      secure,
      maxAgeMs: 0,
      domain: normalizedDomain,
    }),
  ];

  if (normalizedDomain) {
    cookies.push(
      createTokenCookie(ACCESS_TOKEN_COOKIE_NAME, "", {
        secure,
        maxAgeMs: 0,
      }),
      createTokenCookie(REFRESH_TOKEN_COOKIE_NAME, "", {
        secure,
        maxAgeMs: 0,
      }),
    );
  }

  return cookies;
}

export function getAccessTokenFromCookies(cookies) {
  return cookies?.[ACCESS_TOKEN_COOKIE_NAME] ?? "";
}

export function getRefreshTokenFromCookies(cookies) {
  return cookies?.[REFRESH_TOKEN_COOKIE_NAME] ?? "";
}

export function resolveJwtSecret() {
  const explicitSecret = normalizeSecret(process.env.JWT_SECRET);

  if (explicitSecret) {
    return explicitSecret;
  }

  const databaseUrl = normalizeSecret(process.env.DATABASE_URL);

  if (databaseUrl) {
    return createHash("sha256").update(databaseUrl, "utf8").digest("hex");
  }

  return "local-safety360-dev-secret";
}
