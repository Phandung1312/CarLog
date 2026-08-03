import { expect, test } from "@playwright/test";

test("all curated scenarios are reachable from the library", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Android boot", "Start media", "Vehicle speed changed", "Cluster speed is not updating", "Switch user", "Vehicle suspend"]) {
    await expect(page.getByRole("button", { name: new RegExp(name, "i") })).toBeVisible();
  }
});

test("a catalog scenario controls the shared timeline", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Android boot/i }).click();
  await expect(page.getByText("Boot ROM", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByText("Bootloader and verified boot", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/scenario=android-boot/);
});

test("concept images expose every typed component without WebGL", async ({ page }) => {
  await page.goto("/?presentation=render");
  const hotspots = page.locator(".generated-hotspots button");
  await expect(hotspots).toHaveCount(15);
  await hotspots.filter({ hasText: "VHAL" }).click();
  await expect(page.getByRole("heading", { name: "Vehicle HAL" })).toBeVisible();
});
