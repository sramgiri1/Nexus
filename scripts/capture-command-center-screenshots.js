import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import process from "node:process";

import { COMMAND_CENTER_ROUTES } from "../dashboard/src/data/commandCenterRoutes.js";

const { chromium } = await import("../dashboard/node_modules/playwright/index.mjs");

const ROOT = process.cwd();
const DASHBOARD_DIR = join(ROOT, "dashboard");
const AUDIT_DIR = join(ROOT, "reports", "ui-audit");
const DARK_DIR = join(AUDIT_DIR, "dark");
const LIGHT_DIR = join(AUDIT_DIR, "light");
const MANIFEST_PATH = join(AUDIT_DIR, "manifest.json");
const REPORT_PATH = join(AUDIT_DIR, "visual-qa-report.md");
const THEMES = ["dark", "light"];
const PORT = 4273;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const STALE_LABELS = [
  "Requires P37",
  "Requires P38",
  "Requires P39",
  "Requires P40",
  "Requires P41",
  "P38-LOCAL",
  "P39-LOCAL",
  "P40-LOCAL",
  "P41-LOCAL",
];

const REQUIRED_BASE_ROUTE_PATHS = [
  "/command-center",
  "/command-center/workspace",
  "/command-center/tasks",
  "/command-center/workbench",
  "/command-center/implementation",
  "/command-center/liveapi",
  "/command-center/database",
  "/command-center/evidence",
  "/command-center/safety",
  "/command-center/projects",
  "/command-center/roadmap",
  "/command-center/demo",
];

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

function ensureAuditDirs() {
  mkdirSync(DARK_DIR, { recursive: true });
  mkdirSync(LIGHT_DIR, { recursive: true });
}

function routeSlug(route) {
  if (route.path === "/command-center") return "command-center";
  const segments = route.path.split("/").filter(Boolean);
  return segments[segments.length - 1].toLowerCase();
}

function bool(value) {
  return value === true;
}

function emptyChecks() {
  return {
    headingVisible: false,
    themeControlVisible: false,
    sidebarVisible: false,
    staleLabelsAbsent: false,
    rawDumpAbsent: false,
  };
}

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for dashboard server at ${url}${lastError ? ` (${lastError.message})` : ""}`);
}

async function startDashboardServer() {
  const viteBin = join(DASHBOARD_DIR, "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteBin)) {
    throw new Error("dashboard/node_modules/vite/bin/vite.js not found");
  }

  const server = spawn(
    process.execPath,
    [viteBin, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
    {
      cwd: DASHBOARD_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NO_COLOR: "1",
        BROWSER: "none",
      },
    },
  );

  let stdout = "";
  let stderr = "";
  server.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  server.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  try {
    await waitForServer(BASE_URL);
  } catch (error) {
    server.kill("SIGTERM");
    throw new Error(`Could not start dashboard server: ${error.message}\n${stdout}\n${stderr}`.trim());
  }

  return {
    server,
    stop: async () => {
      if (server.exitCode !== null) return;
      server.kill("SIGTERM");
      const exited = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 2_000);
        server.once("exit", () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });
      if (!exited && server.exitCode === null) {
        server.kill("SIGKILL");
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 2_000);
          server.once("exit", () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
    },
  };
}

function primaryTargetPath(route) {
  return route.path;
}

async function captureRoute(browser, route, theme) {
  const screenshots = {};
  const checks = emptyChecks();
  const warnings = [];
  const errors = [];
  const slug = routeSlug(route);
  const screenshotPath = `reports/ui-audit/${theme}/${slug}.png`;
  const absoluteScreenshotPath = join(ROOT, screenshotPath);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    colorScheme: theme,
  });

  await context.addInitScript((selectedTheme) => {
    try {
      window.localStorage.setItem("nexus-theme", selectedTheme);
    } catch {
      // Ignore storage failures and let the app fall back to system defaults.
    }
  }, theme);

  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}${primaryTargetPath(route)}`, { waitUntil: "networkidle" });
    await page.locator(".ccv2-shell").waitFor({ state: "visible", timeout: 15_000 });
    await page.locator(".ccv2-page-head__title").first().waitFor({ state: "visible", timeout: 15_000 });

    const bodyText = await page.locator("body").innerText();
    const headingText = await page.locator(".ccv2-page-head__title").first().innerText();
    const themeState = await page.evaluate(() => ({
      rootTheme: document.documentElement.getAttribute("data-nexus-theme"),
      resolvedTheme: document.documentElement.getAttribute("data-nexus-resolved-theme"),
      shellTheme: document.querySelector(".ccv2-shell")?.getAttribute("data-nexus-theme"),
      shellResolvedTheme: document.querySelector(".ccv2-shell")?.getAttribute("data-nexus-resolved-theme"),
    }));

    checks.headingVisible = headingText.includes(route.expectedHeading);
    checks.themeControlVisible = await page.locator(".ccv2-theme-control").isVisible().catch(() => false);
    checks.sidebarVisible = await page.locator(".ccv2-sidebar").isVisible().catch(() => false);
    checks.staleLabelsAbsent = route.allowPhaseLabels
      ? true
      : !STALE_LABELS.some((label) => bodyText.includes(label));
    checks.rawDumpAbsent = !bodyText.includes("snapshotVersion")
      && !bodyText.includes("\"generatedAt\"")
      && !bodyText.includes("{\"");

    if (route.key !== "demo" && bodyText.includes("DEMOAPP ACTIVE")) {
      warnings.push("DemoApp boundary text leaked outside the demo route.");
    }

    if (!bool(checks.headingVisible)) errors.push(`Expected heading not visible: ${route.expectedHeading}`);
    if (!bool(checks.themeControlVisible)) errors.push("Theme control is not visible.");
    if (!bool(checks.sidebarVisible)) errors.push("Sidebar is not visible.");
    if (!bool(checks.staleLabelsAbsent)) errors.push("Stale phase labels are visible on a non-roadmap route.");
    if (!bool(checks.rawDumpAbsent)) errors.push("Raw JSON/log dump markers are visible in primary content.");

    if (themeState.rootTheme !== theme && themeState.shellTheme !== theme) {
      warnings.push(`Stored theme did not resolve to ${theme} at the root attribute level.`);
    }
    if (!themeState.resolvedTheme && !themeState.shellResolvedTheme) {
      warnings.push("Resolved theme attribute missing.");
    }

    await page.screenshot({
      path: absoluteScreenshotPath,
      fullPage: true,
    });

    screenshots[theme] = screenshotPath;
  } catch (error) {
    errors.push(error.message);
  } finally {
    await context.close();
  }

  return {
    screenshots,
    checks,
    warnings,
    errors,
  };
}

function buildRouteEntry(route) {
  return {
    path: route.path,
    name: route.name,
    status: "skipped",
    implemented: route.status !== "planned",
    allowPhaseLabels: route.allowPhaseLabels === true,
    screenshots: {},
    checks: emptyChecks(),
    warnings: [],
    errors: [],
  };
}

function buildReport(manifest) {
  const coverageRows = manifest.routes.map((route) => {
    const dark = route.screenshots.dark ? `[dark](${route.screenshots.dark})` : "—";
    const light = route.screenshots.light ? `[light](${route.screenshots.light})` : "—";
    const notes = [...route.warnings, ...route.errors].join("; ") || (route.status === "skipped" ? "Planned/unavailable" : "—");
    return `| \`${route.path}\` | ${route.name} | ${dark} | ${light} | ${route.status} | ${notes} |`;
  }).join("\n");

  return `# NEXUS Command Center Visual QA Report

## Metadata
- Generated at: ${manifest.generatedAt}
- Validation branch: ${manifest.branch}
- Validation HEAD: ${manifest.head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
- P41.5.5 route-wide screenshot UX audit
- dark and light themes
- Command Center routes

## Summary
- routes expected: ${manifest.summary.routesExpected}
- routes captured: ${manifest.summary.routesCaptured}
- routes skipped/planned: ${manifest.summary.routesSkipped}
- screenshots captured: ${manifest.summary.screenshotsCaptured}
- failures: ${manifest.summary.failures}
- warnings: ${manifest.warnings.length + manifest.routes.reduce((count, route) => count + route.warnings.length, 0)}

## Route Coverage Table
| Route | Page | Dark screenshot | Light screenshot | Status | Notes |
| --- | --- | --- | --- | --- | --- |
${coverageRows}

## UX Checks
- stale phase labels absent from non-roadmap routes
- theme control visible
- heading visible
- sidebar visible
- no raw JSON/log dumps in primary UX
- DemoApp boundary preserved

## Known Limitations
- The screenshot audit uses the dashboard's local Vite server and the UI's existing snapshot/file-backed fallbacks. It does not require the local API to be online.
- Planned routes are recorded as skipped in the manifest rather than being silently ignored.

## Next Phase
P41.5.6 — Usage Docs + Codebase Docs + README Finalization
`;
}

async function main() {
  ensureAuditDirs();

  const manifest = {
    auditVersion: "1.0",
    phase: "P41.5.5",
    generatedAt: new Date().toISOString(),
    branch: gitOutput(["branch", "--show-current"]),
    head: gitOutput(["rev-parse", "--short", "HEAD"]),
    themes: THEMES,
    summary: {
      routesExpected: COMMAND_CENTER_ROUTES.length,
      routesCaptured: 0,
      routesSkipped: 0,
      screenshotsCaptured: 0,
      failures: 0,
    },
    routes: [],
    warnings: [],
    errors: [],
  };

  const missingBaseRoutes = REQUIRED_BASE_ROUTE_PATHS.filter(
    (path) => !COMMAND_CENTER_ROUTES.some((route) => route.path === path),
  );

  if (missingBaseRoutes.length > 0) {
    manifest.errors.push(`Route matrix missing required base routes: ${missingBaseRoutes.join(", ")}`);
  }

  let serverHandle = null;
  let browser = null;

  try {
    serverHandle = await startDashboardServer();
    browser = await chromium.launch({ headless: true });

    for (const route of COMMAND_CENTER_ROUTES) {
      const routeEntry = buildRouteEntry(route);

      if (route.status === "planned") {
        routeEntry.status = "skipped";
        routeEntry.warnings.push("Route is marked planned in commandCenterRoutes.js.");
        manifest.summary.routesSkipped += 1;
        manifest.routes.push(routeEntry);
        continue;
      }

      let routeFailed = false;
      for (const theme of THEMES) {
        const result = await captureRoute(browser, route, theme);
        routeEntry.screenshots[theme] = result.screenshots[theme];
        routeEntry.checks.headingVisible = routeEntry.checks.headingVisible || result.checks.headingVisible;
        routeEntry.checks.themeControlVisible = routeEntry.checks.themeControlVisible || result.checks.themeControlVisible;
        routeEntry.checks.sidebarVisible = routeEntry.checks.sidebarVisible || result.checks.sidebarVisible;
        routeEntry.checks.staleLabelsAbsent = routeEntry.checks.staleLabelsAbsent || result.checks.staleLabelsAbsent;
        routeEntry.checks.rawDumpAbsent = routeEntry.checks.rawDumpAbsent || result.checks.rawDumpAbsent;
        routeEntry.warnings.push(...result.warnings.map((warning) => `${theme}: ${warning}`));
        routeEntry.errors.push(...result.errors.map((error) => `${theme}: ${error}`));
        if (!result.screenshots[theme]) routeFailed = true;
        if (result.screenshots[theme]) manifest.summary.screenshotsCaptured += 1;
      }

      routeEntry.status = routeFailed ? "failed" : "captured";
      if (routeFailed) {
        manifest.summary.failures += 1;
      } else {
        manifest.summary.routesCaptured += 1;
      }

      manifest.routes.push(routeEntry);
    }
  } catch (error) {
    manifest.errors.push(error.message);
    manifest.summary.failures += 1;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (serverHandle) {
      await serverHandle.stop().catch(() => {});
    }
  }

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  writeFileSync(REPORT_PATH, buildReport(manifest), "utf8");

  console.log("NEXUS Command Center Screenshot Audit");
  console.log("=====================================");
  console.log(`Routes expected: ${manifest.summary.routesExpected}`);
  console.log(`Routes captured: ${manifest.summary.routesCaptured}`);
  console.log(`Routes skipped: ${manifest.summary.routesSkipped}`);
  console.log(`Screenshots captured: ${manifest.summary.screenshotsCaptured}`);
  console.log(`Failures: ${manifest.summary.failures}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log(`Report: ${REPORT_PATH}`);

  if (manifest.summary.failures > 0 || manifest.errors.length > 0) {
    process.exitCode = 1;
  }
}

await main();
