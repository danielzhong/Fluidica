import { test, expect } from "@playwright/test";

test("scroll entrances settle, do not replay, and the reading indicator follows the page", async ({
  page,
}) => {
  await page.goto("./");
  const card = page.locator(".value-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS("opacity", "1");
  await expect
    .poll(() =>
      card.evaluate(
        (element) =>
          element
            .getAnimations()
            .filter(
              (a) =>
                a instanceof Animation &&
                a.effect instanceof KeyframeEffect &&
                a.effect.getKeyframes().some((frame) => "opacity" in frame),
            ).length,
      ),
    )
    .toBe(0);
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".reading-progress")
        .evaluate((element) =>
          Number(
            (element as HTMLElement).style.getPropertyValue(
              "--reading-progress",
            ),
          ),
        ),
    )
    .toBeGreaterThan(0.95);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS("opacity", "1");
  expect(
    await card.evaluate((element) =>
      element
        .getAnimations()
        .some(
          (a) =>
            a.effect instanceof KeyframeEffect &&
            a.effect.getKeyframes().some((frame) => "opacity" in frame),
        ),
    ),
  ).toBe(false);
});

test("reduced motion keeps all content visible and cancels effects when the preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-image-frame")).toHaveCSS(
    "transform",
    "none",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === "running" || animation.pending,
            ).length,
      ),
    )
    .toBe(0);
  await page.locator(".value-card").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".value-card").last()).toHaveCSS("opacity", "1");
  await page.reload();
  await expect(page.locator("h1")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-halo")).toHaveCSS("animation-name", "none");
  const trigger = page.locator(".hero-actions [data-project-trigger]");
  await trigger.click();
  await expect(page.locator("#project-dialog")).toBeVisible();
  await expect(page.locator("#project-dialog")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("page content and photo links stay available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.locator("h1")).toBeVisible();
  const photo = page.locator("[data-lab-photo]").first();
  await photo.scrollIntoViewIfNeeded();
  await expect(photo).toBeVisible();
  await expect(photo.locator("img")).toHaveJSProperty("complete", true);
  const imageURL = await photo.getAttribute("href");
  await photo.click();
  expect(new URL(page.url()).pathname).toBe(imageURL);
  await context.close();
});
