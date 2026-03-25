import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE_NAME = "safety360_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

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

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token) {
  return createHash("sha256").update(String(token ?? ""), "utf8").digest("hex");
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

export function createSessionCookie(token, { secure = false, maxAgeMs = SESSION_MAX_AGE_MS } = {}) {
  const maxAge = Math.max(0, Math.floor(maxAgeMs / 1000));
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearSessionCookie({ secure = false } = {}) {
  return createSessionCookie("", { secure, maxAgeMs: 0 });
}
