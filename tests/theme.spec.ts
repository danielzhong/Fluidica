import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForMotion } from "./helpers";

test("dark is the default even when the device prefers light; theme persists across pages", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page).toHaveTitle(/Fluid Fabs/);
  await expect(
    page.getByRole("link", { name: "Fluid Fabs home" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(() => localStorage.getItem("fluid-fabs-theme")),
  ).toBe("light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("theme toggle still works if browser storage is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("back to top appears after scrolling and returns scrolling and keyboard focus to the top", async ({
  page,
}) => {
  await page.goto("./");
  const button = page.getByRole("button", { name: "Back to top", exact: true });
  await expect(button).not.toBeVisible();
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(button).not.toBeVisible();
  await expect(page.locator("#top")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("light mode retains accessible page and inquiry colors", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  const scan = async () => {
    await waitForMotion(page);
    return new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
  };
  expect((await scan()).violations).toEqual([]);
  await page.locator(".hero-actions [data-project-trigger]").click();
  expect((await scan()).violations).toEqual([]);
});
