import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.SAFE_NEXUS_E2E_BASE_URL || "http://127.0.0.1:3000";
const startLocalServer = !process.env.SAFE_NEXUS_E2E_BASE_URL;
const healthURL = new URL("/api/health", baseURL).toString();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
  webServer: startLocalServer
    ? {
        command: "npm run dev",
        url: healthURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
