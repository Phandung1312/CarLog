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

test("a validated share URL restores presentation, scenario, step and selection", async ({ page }) => {
  await page.goto("/?presentation=render&mode=signal&scenario=android-boot&step=2&component=vhal");
  await expect(page.getByText("Linux kernel", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vehicle HAL" })).toBeVisible();
  await expect(page.locator(".generated-vehicle-layer")).toBeVisible();
});

test("keyboard search opens the matching entity", async ({ page }) => {
  await page.goto("/?presentation=render");
  await page.keyboard.press("Control+K");
  await page.getByRole("textbox", { name: "Search knowledge graph" }).fill("Vehicle HAL");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Vehicle HAL" })).toBeVisible();
});

test("reduced motion is reflected in the app shell", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?presentation=render");
  await expect(page.locator("main.app")).toHaveClass(/reduced-motion/);
});
