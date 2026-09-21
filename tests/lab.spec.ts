import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("lab photos load, open at full size and support keyboard browsing", async ({
  page,
}) => {
  await page.goto("./");
  const gallery = page.locator("#lab");
  const photos = gallery.locator("[data-lab-photo]");
  await expect(photos).toHaveCount(7);
  await gallery.scrollIntoViewIfNeeded();
  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        photo
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
  }

  const first = photos.first();
  await first.click();
  const viewer = page.getByRole("dialog", {
    name: "Our chips, in the experiment.",
  });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator(".viewer-counter")).toHaveText("1 / 7");
  await expect(
    viewer.getByRole("button", { name: "Close lab photo" }),
  ).toBeFocused();
  const originalURL = await first.getAttribute("href");
  await expect(viewer.locator(".viewer-image")).toHaveJSProperty(
    "src",
    new URL(originalURL!, page.url()).href,
  );

  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#lab-viewer .viewer-counter")).toHaveText("7 / 7");
  await page.getByRole("button", { name: "Next lab photo" }).click();
  await expect(viewer.locator(".viewer-counter")).toHaveText("1 / 7");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#lab-viewer-title")).toHaveText(
    "Printed. Connected. Put to work.",
  );
  expect(
    await page
      .locator("#lab-viewer")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(page.locator("#lab-viewer")).not.toBeVisible();
  await expect(first).toBeFocused();
});
