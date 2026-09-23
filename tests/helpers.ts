import type { Page } from "@playwright/test";

// Contrast checks need the final colors, rather than a partly transparent entrance.
export async function waitForMotion(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}
