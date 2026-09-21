import { defineConfig, devices } from "@playwright/test";

const basePath = `/${(process.env.BASE_PATH || "").replace(/^\/+|\/+$/g, "")}`;
const appPath = basePath === "/" ? "/" : `${basePath}/`;
const port = process.env.BASE_PATH ? 4323 : 4322;
const baseURL = `http://127.0.0.1:${port}${appPath}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${port} --ignore-lock`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !process.env.BASE_PATH,
  },
});
