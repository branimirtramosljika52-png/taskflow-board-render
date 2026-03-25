import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createPasswordHash,
  createSessionCookie,
  hashSessionToken,
  parseCookies,
  verifyPassword,
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

test("cookie helpers parse, create, clear, and hash session tokens", () => {
  const cookie = createSessionCookie("abc123", { secure: true, maxAgeMs: 60_000 });

  assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.equal(
    parseCookies(`${SESSION_COOKIE_NAME}=abc123; theme=light`)[SESSION_COOKIE_NAME],
    "abc123",
  );
  assert.equal(hashSessionToken("abc123").length, 64);
  assert.match(clearSessionCookie({ secure: true }), /Max-Age=0/);
});
