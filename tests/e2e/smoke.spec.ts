import { test, expect } from "@playwright/test";

test.skip(!process.env.RUN_E2E, "Set RUN_E2E=1 to run browser smoke tests");

test("public booking landing page is reachable", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
});
