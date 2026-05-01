import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4273",
    viewport: { width: 1440, height: 960 },
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 4273",
    url: "http://127.0.0.1:4273",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
