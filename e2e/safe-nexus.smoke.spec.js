import { expect, test } from "@playwright/test";

const e2eUser = {
  email: process.env.SAFE_NEXUS_E2E_EMAIL || "admin@local.test",
  password: process.env.SAFE_NEXUS_E2E_PASSWORD || "admin",
};

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function loginByApi(page) {
  const loginResponse = await page.request.post("/api/auth/login", {
    data: e2eUser,
  });

  if (!loginResponse.ok()) {
    return {
      ok: false,
      reason: `API login nije uspio (${loginResponse.status()}): ${await readResponseText(loginResponse)}`,
    };
  }

  const sessionResponse = await page.request.get("/api/auth/session");
  if (!sessionResponse.ok()) {
    return {
      ok: false,
      reason: `Session provjera nije uspjela (${sessionResponse.status()}).`,
    };
  }

  const session = await sessionResponse.json();
  return {
    ok: Boolean(session.authenticated),
    reason: session.authenticated ? "" : "Session nije autentificiran nakon login poziva.",
    user: session.user,
  };
}

async function dismissWelcomeGuide(page) {
  const skipButton = page.getByRole("button", { name: /Kasnije/i }).first();
  await skipButton.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click({ timeout: 3_000 }).catch(() => skipButton.dispatchEvent("click"));
    await expect(skipButton).toBeHidden({ timeout: 5_000 }).catch(() => {});
  }
}

test.describe("SafeNexus smoke", () => {
  test("health endpoint odgovara", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true }));
  });

  test("login ekran se ucitava", async ({ page }) => {
    const browserErrors = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        browserErrors.push(message.text());
      }
    });

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/SafeNexus/i);
    await expect(page.locator("#login-form")).toBeVisible();
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    expect(browserErrors, browserErrors.join("\n")).toHaveLength(0);
  });

  test("autentificirani workspace se otvara", async ({ page }) => {
    const login = await loginByApi(page);
    test.skip(!login.ok, login.reason);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissWelcomeGuide(page);

    await expect(page.locator("#app-shell")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Dashboard|Tvrtke|Procjena rizika|Radni nalozi/i);
  });

  test("modul Procjena rizika se otvara iz navigacije", async ({ page, isMobile }) => {
    test.skip(isMobile, "Sidebar smoke provjera je desktop-only.");

    const login = await loginByApi(page);
    test.skip(!login.ok, login.reason);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissWelcomeGuide(page);
    await expect(page.locator("#app-shell")).toBeVisible();

    const riskAssessmentNav = page.locator('[data-sidebar-item="risk-assessment"]');
    if (!(await riskAssessmentNav.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /^Temeljna dokumentacija$/i }).click();
    }

    const foundationToggle = page.locator('[data-group-toggle="foundation"]');
    if (
      !(await riskAssessmentNav.isVisible().catch(() => false))
      && await foundationToggle.isVisible().catch(() => false)
    ) {
      await foundationToggle.click();
    }

    await riskAssessmentNav.scrollIntoViewIfNeeded();
    await riskAssessmentNav.click();

    await expect(page.locator("#risk-assessment-module")).toBeVisible();
    await expect(page.locator("#risk-assessment-new")).toBeVisible();
  });
});
