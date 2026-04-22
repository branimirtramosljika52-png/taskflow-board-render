import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  createAccessToken,
  createAuthCookies,
  createPasswordHash,
  createRefreshToken,
  hashStoredToken,
  parseCookies,
  verifyPassword,
  verifyToken,
} from "../src/webAuth.js";

test("password helpers verify both legacy and scrypt formats", async () => {
  const hashed = await createPasswordHash("tajna123");

  await assert.doesNotReject(() => verifyPassword("tajna123", hashed));
  assert.deepEqual(await verifyPassword("tajna123", "tajna123"), {
    ok: true,
    needsUpgrade: true,
  });
  assert.deepEqual(await verifyPassword("krivo", "tajna123"), {
    ok: false,
    needsUpgrade: true,
  });
  assert.equal((await verifyPassword("tajna123", hashed)).ok, true);
  assert.equal((await verifyPassword("krivo", hashed)).ok, false);
});

test("jwt helpers sign and verify both access and refresh tokens", () => {
  const user = {
    id: "42",
    username: "branimir",
    fullName: "Branimir Test",
    role: "admin",
  };

  const accessToken = createAccessToken(user, "super-tajni-kljuc");
  const refreshToken = createRefreshToken(user, "super-tajni-kljuc");

  const verifiedAccess = verifyToken(accessToken, "super-tajni-kljuc", { expectedType: "access" });
  const verifiedRefresh = verifyToken(refreshToken, "super-tajni-kljuc", { expectedType: "refresh" });

  assert.equal(verifiedAccess.ok, true);
  assert.equal(verifiedAccess.payload.sub, "42");
  assert.equal(verifiedAccess.payload.username, "branimir");
  assert.equal(verifiedAccess.payload.type, "access");

  assert.equal(verifiedRefresh.ok, true);
  assert.equal(verifiedRefresh.payload.sub, "42");
  assert.equal(verifiedRefresh.payload.type, "refresh");

  assert.equal(verifyToken(accessToken, "krivi-kljuc", { expectedType: "access" }).ok, false);
});

test("cookie helpers parse, create, clear, and hash auth tokens", () => {
  const cookies = createAuthCookies({
    accessToken: "access123",
    refreshToken: "refresh123",
    secure: true,
    domain: "safe-nexus.org",
  });

  assert.equal(cookies.length, 4);
  assert.match(cookies[0], new RegExp(`^${ACCESS_TOKEN_COOKIE_NAME}=`));
  assert.match(cookies[1], new RegExp(`^${REFRESH_TOKEN_COOKIE_NAME}=`));
  assert.match(cookies[2], new RegExp(`^${ACCESS_TOKEN_COOKIE_NAME}=`));
  assert.match(cookies[3], new RegExp(`^${REFRESH_TOKEN_COOKIE_NAME}=`));
  assert.match(cookies[0], /HttpOnly/);
  assert.match(cookies[0], /Secure/);
  assert.match(cookies[0], /Domain=safe-nexus.org/);
  assert.match(cookies[1], /Domain=safe-nexus.org/);
  assert.equal(/Domain=/.test(cookies[2]), false);
  assert.equal(/Domain=/.test(cookies[3]), false);
  assert.equal(
    parseCookies(`${ACCESS_TOKEN_COOKIE_NAME}=access123; theme=light`)[ACCESS_TOKEN_COOKIE_NAME],
    "access123",
  );
  assert.equal(hashStoredToken("refresh123").length, 64);

  const clearedCookies = clearAuthCookies({ secure: true, domain: "safe-nexus.org" });
  assert.equal(clearedCookies.length, 4);
  assert.match(clearedCookies[0], /Max-Age=0/);
  assert.match(clearedCookies[1], /Max-Age=0/);
  assert.match(clearedCookies[2], /Max-Age=0/);
  assert.match(clearedCookies[3], /Max-Age=0/);
  assert.match(clearedCookies[0], /Domain=safe-nexus.org/);
  assert.match(clearedCookies[1], /Domain=safe-nexus.org/);
  assert.equal(/Domain=/.test(clearedCookies[2]), false);
  assert.equal(/Domain=/.test(clearedCookies[3]), false);
});
