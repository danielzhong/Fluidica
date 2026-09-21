import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test("home, image and links render without overflow or runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page).toHaveTitle(/Fluidica — AI-designed microfluidics/);
  await expect(page.locator("h1")).toHaveText(
    /Your next big idea\.\s*On a very small chip\./,
  );
  const image = page.locator(".hero-image");
  await expect(image).toBeVisible();
  expect(
    await image.evaluate(
      (element: HTMLImageElement) =>
        element.complete && element.naturalWidth === 1672,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const anchors = await page
    .locator('a[href*="#"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")!.split("#")[1]),
    );
  for (const id of anchors)
    expect(await page.locator(`[id="${id}"]`).count()).toBe(1);
  expect(errors).toEqual([]);
});

test("application tabs work by pointer and keyboard", async ({ page }) => {
  await page.goto("./");
  const droplets = page.getByRole("tab", { name: /Droplet microfluidics/ });
  await droplets.click();
  await expect(droplets).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText(
    "Small volumes. Space to explore.",
  );
  await droplets.press("ArrowDown");
  await expect(
    page.getByRole("tab", { name: /Cell & bioassay/ }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Your experiment sets the geometry.",
  );
});

test("FAQ answers expand and privacy page is available", async ({ page }) => {
  await page.goto("./");
  await page.locator(".faq-item summary").first().click();
  await expect(page.locator(".faq-item").first()).toHaveAttribute("open", "");
  await expect(page.locator(".faq-item").first().locator("p")).toBeVisible();
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Privacy, in plain language.");
});

test("inquiry validates, downloads an accurate brief and restores focus", async ({
  page,
}) => {
  await page.goto("./");
  const trigger = page.locator(".hero-actions [data-project-trigger]");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Your name")).toBeFocused();
  await dialog.getByRole("button", { name: "Download brief" }).click();
  expect(
    await dialog
      .locator("form")
      .evaluate((form: HTMLFormElement) => form.checkValidity()),
  ).toBe(false);
  await dialog.getByLabel("Your name").fill("Test Researcher");
  await dialog.getByLabel("Email address").fill("researcher@example.com");
  await dialog.getByLabel("Organization").fill("Example Lab");
  await dialog
    .getByLabel("Application", { exact: true })
    .selectOption("Droplet generation");
  await dialog
    .getByLabel("What would you like to build?")
    .fill("Explore a custom droplet chip for a new research experiment.");
  const downloadEvent = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download brief" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("fluidica-project-brief.txt");
  const text = await readFile((await download.path())!, "utf8");
  expect(text).toContain("Name: Test Researcher");
  expect(text).toContain("Application: Droplet generation");
  expect(text).toContain("Contact: danielzhong2000@gmail.com");
  await expect(dialog.getByRole("status")).toContainText("ready to download");
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("mobile navigation opens, closes and restores keyboard focus", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await page.goto("./");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Technology" }).focus();
  await page.keyboard.press("Escape");
  await expect(nav).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await nav.getByRole("button", { name: "Start a project" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
});

test("page and project dialog meet automated accessibility checks", async ({
  page,
}) => {
  await page.goto("./");
  const scan = () =>
    new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
  expect((await scan()).violations).toEqual([]);
  await page.locator(".hero-actions [data-project-trigger]").click();
  expect((await scan()).violations).toEqual([]);
});

test("deployment base keeps navigation, assets and sharing URLs intact", async ({
  page,
  request,
  baseURL,
}) => {
  const deploymentPath = new URL(baseURL!).pathname;
  await page.goto("./");

  const publicURLs = await page
    .locator('img[src], script[src], link[rel="stylesheet"], link[rel="icon"]')
    .evaluateAll((elements) =>
      elements.map(
        (element) =>
          element.getAttribute("src") || element.getAttribute("href")!,
      ),
    );
  for (const value of new Set(publicURLs)) {
    const url = new URL(value, baseURL);
    expect(url.pathname).toMatch(new RegExp(`^${deploymentPath}`));
    expect(
      (await request.get(url.href)).ok(),
      `Asset is available: ${value}`,
    ).toBe(true);
  }

  const localLinks = await page
    .locator('a[href^="/"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")!),
    );
  for (const href of localLinks)
    expect(href.startsWith(deploymentPath)).toBe(true);

  if (process.env.SITE_URL) {
    const publicHome = new URL(deploymentPath, process.env.SITE_URL).href;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      publicHome,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      publicHome,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new URL(`${deploymentPath}images/fluidica-chip.png`, process.env.SITE_URL)
        .href,
    );
  }

  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  expect(new URL(page.url()).pathname).toBe(`${deploymentPath}privacy/`);
  await expect(
    page.getByRole("link", { name: "← Back to Fluidica" }),
  ).toHaveAttribute("href", deploymentPath);
  if (process.env.SITE_URL) {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new URL(`${deploymentPath}privacy/`, process.env.SITE_URL).href,
    );
  }

  await page.goto("404.html");
  await expect(page.locator("h1")).toContainText("Let’s get back");
  await page.getByRole("link", { name: "Back to Fluidica →" }).click();
  expect(new URL(page.url()).pathname).toBe(deploymentPath);
});
