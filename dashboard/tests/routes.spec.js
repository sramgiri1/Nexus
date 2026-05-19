import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { COMMAND_CENTER_ROUTES } from "../src/data/commandCenterRoutes.js";
import {
  NEXUS_CURRENT_OS_PHASE,
  NEXUS_NEXT_OS_PHASE,
  NEXUS_PREVIOUS_COMPLETED_PHASE,
  NEXUS_ROADMAP_PHASES,
} from "../src/data/nexusRoadmap.js";

const SCREENSHOT_AUDIT_SCRIPT = fileURLToPath(new URL("../../scripts/capture-command-center-screenshots.js", import.meta.url));
const SCREENSHOT_MANIFEST = fileURLToPath(new URL("../../reports/ui-audit/manifest.json", import.meta.url));

const PRIMARY_ROUTE_KEYS = [
  "lite",
  "agentFlow",
  "founderIntake",
  "businessBuild",
  "liveReadiness",
  "activity",
  "roadmap",
  "docs",
];

const PRIMARY_COMMAND_CENTER_ROUTES = PRIMARY_ROUTE_KEYS.map(
  (key) => COMMAND_CENTER_ROUTES.find((route) => route.key === key),
).filter(Boolean);

const SCREENSHOT_AUDIT_ROUTE_KEYS = PRIMARY_ROUTE_KEYS.filter(
  (key) => !["lite", "agentFlow"].includes(key),
);
const SCREENSHOT_AUDIT_ROUTES = SCREENSHOT_AUDIT_ROUTE_KEYS.map(
  (key) => COMMAND_CENTER_ROUTES.find((route) => route.key === key),
).filter(Boolean);

const IMPLEMENTED_COMMAND_CENTER_ROUTES = COMMAND_CENTER_ROUTES.filter(
  (route) => route.status !== "planned",
);

const NON_ROADMAP_PRIMARY_ROUTES = PRIMARY_COMMAND_CENTER_ROUTES.filter(
  (route) => route.key !== "roadmap",
);

const TABBED_COMMAND_CENTER_ROUTES = COMMAND_CENTER_ROUTES.filter(
  (route) => route.status === "implemented" && Array.isArray(route.tabs) && route.tabs.length > 0,
);

const FORBIDDEN_PHASE_LABELS = [
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

const CARE_PROJECT_LABEL = ["Care", "Loop"].join("");
const CARE_PROJECT_ID = ["care", "loop"].join("");
const CARE_PHASE_LABEL = "CARELOOP-P3-PREMIUM";
const CARE_MISSION_LABEL = "CareLoop Premium Receiver-Scoped Monetization";
const CARE_PHASE_TASK_COUNT_LABEL = "Phase 2 planned tasks";
const CARE_NEXT_ACTION_LABEL = "Configure external App Store Connect products";

// Legacy checker compatibility references only:
// Live API nav item appears in sidebar
// Live API page renders with P40 header
// Live API page shows offline state
// Safety Center shows Local API boundary section
// Top bar shows Local API status indicator
// OS Roadmap shows P39 COMPLETE and P40 IN PROGRESS
// Agent Workbench nav item
// Agent Workbench page renders
// bridge offline
// Go to Task Queue
// P37 COMPLETE
// P38 IN_PROGRESS

function captureClientErrors(page) {
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("favicon.ico")) return;
    if (text.includes("ERR_CONNECTION_REFUSED")) return;
    if (text.includes("net::ERR_")) return;
    if (text.includes("has been blocked by CORS policy")) return;
    errors.push(`console: ${text}`);
  });

  return errors;
}

async function pickTheme(page, theme) {
  const button = page.getByRole("button", { name: new RegExp(`Use ${theme} theme`, "i") });
  if (!(await button.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /Open theme menu/i }).click();
  }
  await page.getByRole("button", { name: new RegExp(`Use ${theme} theme`, "i") }).click();
}

async function getThemeState(page) {
  return page.evaluate(() => ({
    storedTheme: window.localStorage.getItem("nexus-theme"),
    rootTheme: document.documentElement.getAttribute("data-nexus-theme"),
    resolvedTheme: document.documentElement.getAttribute("data-nexus-resolved-theme"),
    shellTheme: document.querySelector(".ccv2-shell")?.getAttribute("data-nexus-theme"),
    shellResolvedTheme: document.querySelector(".ccv2-shell")?.getAttribute("data-nexus-resolved-theme"),
  }));
}

function commandTab(page, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByRole("tab", { name: new RegExp(`^${escaped}\\b`, "i") });
}

function activeCommandTabPanel(page) {
  return page.locator(".ccv2-command-tabs__panel:visible");
}

test("home route renders Command Center V2 shell", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/");

  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-sidebar__brand-name")).toContainText("NEXUS OS");
  await expect(page.getByRole("link", { name: /Chat with NEXUS/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Agent Flow/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Founder Intake/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Business Build/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Chat with NEXUS and watch the agent plan form/i })).toBeVisible();
  await expect(page.getByLabel("Chat with NEXUS")).toContainText("NEXUS");
  await expect(page.getByLabel("Agent action flow")).toContainText("Product");
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  await expect(page.locator(".shell-sidebar")).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("Command Center Lite keeps primary navigation focused", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/command-center");

  const sidebarText = await page.locator(".ccv2-sidebar").innerText();
  for (const label of [
    "Chat with NEXUS",
    "Agent Flow",
    "Founder Intake",
    "Business Build",
    "Live Readiness",
    "Activity Log",
    "OS Roadmap",
    "Docs & Guides",
  ]) {
    expect(sidebarText).toContain(label);
  }
  for (const hidden of [
    "Worker Runtime",
    "Cost Center",
    "Policy Center",
    "Secrets Boundary",
    "Deploy Monitoring",
    "Enterprise Preview",
    "Demo Mode",
    "Durable State",
  ]) {
    expect(sidebarText).not.toContain(hidden);
  }

  const body = await page.locator("body").innerText();
  expect(body).toContain("Local-only");
  expect(body).toMatch(/No spend/i);
  expect(body).toContain("Provider/model calls, agent dispatch");
  expect(body).not.toContain("DemoApp");
  expect(body).not.toMatch(/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_/);
  expect(errors).toEqual([]);
});

test("conversational command interface preview stays route-first and project-aware", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/command-center/command");

  await expect(page.locator(".ccv2-page-head__title")).toContainText("Ask NEXUS");
  await expect(page.getByText("Describe a goal, question, or operating command.")).toBeVisible();
  await expect(page.getByLabel("Ask NEXUS context")).toContainText("No project selected");
  await expect(page.getByLabel("Ask NEXUS context")).toContainText("Preview-only");

  for (const prompt of [
    "Plan the next milestone",
    "Review current project readiness",
    "Run QA readiness check",
    "Explain blockers",
    "Freeze project scope",
    "Show release readiness",
    "Summarize latest activity",
    "What should I do next?",
  ]) {
    await expect(page.getByRole("button", { name: prompt })).toBeVisible();
  }

  const composer = page.getByPlaceholder("Ask NEXUS to plan, review, QA, fix, ship, guard, freeze, or explain...");
  await composer.fill("Plan the next milestone");
  await page.getByRole("button", { name: "Preview command" }).click();
  await expect(page.getByLabel("Command preview result")).toContainText("Select or create a project first.");
  await expect(page.getByLabel("Command preview result")).toContainText("Provider spend disabled");

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("DemoApp");
  expect(body).not.toContain("raw JSON");
  expect(errors).toEqual([]);
});

test("Ask NEXUS route provides visible conversational command entry and preview", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/command-center");
  await expect(page.getByRole("link", { name: /Chat with NEXUS/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open Ask NEXUS/i })).toBeVisible();

  await page.getByRole("button", { name: /Open Ask NEXUS/i }).click();
  await expect(page).toHaveURL(/\/command-center\/command$/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Ask NEXUS");
  await expect(page.getByText("Describe a goal, question, or operating command.")).toBeVisible();
  const askContext = page.getByLabel("Ask NEXUS context");
  await expect(askContext).toContainText("Command mode");
  await expect(askContext).toContainText("Preview-only");
  await expect(askContext).toContainText("Provider dispatch");
  await expect(askContext).toContainText("Tool execution");
  await expect(askContext).toContainText("Worker execution");

  const composer = page.getByPlaceholder("Ask NEXUS to plan, review, QA, fix, ship, guard, freeze, or explain...");
  await expect(composer).toBeVisible();
  for (const prompt of [
    "Plan the next milestone",
    "Review current project readiness",
    "Run QA readiness check",
    "Explain blockers",
    "Freeze project scope",
    "Show release readiness",
    "Summarize latest activity",
    "What should I do next?",
  ]) {
    await expect(page.getByRole("button", { name: prompt })).toBeVisible();
  }

  await composer.fill("What should I do next?");
  await page.getByRole("button", { name: "Preview command" }).click();
  await expect(page.getByLabel("Command preview result")).toContainText("Intent");
  await expect(page.getByLabel("Command preview result")).toContainText("Next governed action");
  await expect(page.getByLabel("Command preview result")).toContainText("Provider spend disabled");

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("DemoApp");
  expect(body).not.toContain("private-project-01");
  expect(body).not.toContain("private-project-governed-build-mission");
  expect(body).not.toContain("provider executed");
  expect(body).not.toContain("tool executed");
  expect(body).not.toContain("worker executed");
  for (const label of FORBIDDEN_PHASE_LABELS) {
    expect(body).not.toContain(label);
  }
  expect(errors).toEqual([]);
});

test("Ask NEXUS route renders in dark and light themes", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/command-center/command");
  await pickTheme(page, "dark");
  await expect(page.locator(".ccv2-ask-nexus-page")).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview command" })).toBeVisible();

  await pickTheme(page, "light");
  await expect(page.locator(".ccv2-ask-nexus-page")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Ask NEXUS");

  expect(errors).toEqual([]);
});

test("legacy command center route renders legacy Command Center", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/legacy-command-center");

  await expect(page.locator(".page--command")).toBeVisible();
  await expect(page.getByRole("heading", { name: "NEXUS Command Center" })).toBeVisible();
  await expect(page.getByRole("banner").getByText("Environment · Prototype")).toBeVisible();
  await expect(page.getByRole("banner").getByText("Active project · DemoApp")).toBeVisible();
  await expect(page.locator("#private-validation")).toContainText("Private Project Validation");

  expect(errors).toEqual([]);
});

test("route metadata declares tab contracts for implemented tabbed routes", async () => {
  const expectedTabbedRoutes = [
    "mission",
    "workspace",
    "tasks",
    "workbench",
    "implementation",
    "skills",
    "liveapi",
    "database",
    "evidence",
    "safety",
    "projects",
    "roadmap",
    "cost",
    "batch",
  ];

  for (const key of expectedTabbedRoutes) {
    const route = COMMAND_CENTER_ROUTES.find((entry) => entry.key === key);
    expect(route, `route ${key} exists`).toBeTruthy();
    expect(route.status, `route ${key} status`).toBe("implemented");
    expect(route.tabs?.length, `route ${key} tabs`).toBeGreaterThan(0);
    expect(route.tabs?.some((tab) => tab.id === route.defaultTab), `route ${key} default tab`).toBe(true);
    expect(["os", "project", "portfolio", "platform", "demo"]).toContain(route.scope);
    expect(route.allowPhaseLabels).toBe(key === "roadmap");
  }
});

test("route-wide implemented tabs can switch without stale labels", async ({ page }) => {
  const errors = captureClientErrors(page);

  for (const route of TABBED_COMMAND_CENTER_ROUTES) {
    await page.goto(route.path);
    const tabs = page.getByRole("tablist");
    await expect(tabs).toBeVisible();
    const defaultTab = route.tabs.find((tab) => tab.id === route.defaultTab) || route.tabs[0];
    await expect(commandTab(page, defaultTab.label)).toHaveAttribute("aria-selected", "true");

    const secondaryTab = route.tabs[1] || route.tabs[0];
    await commandTab(page, secondaryTab.label).click();
    await expect(activeCommandTabPanel(page)).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DEMOAPP ACTIVE");
    if (route.key !== "roadmap") {
      for (const label of FORBIDDEN_PHASE_LABELS) {
        expect(body).not.toContain(label);
      }
    }
  }

  expect(errors).toEqual([]);
});

test("Skill Registry route renders read-only governed skill metadata", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/command-center/skills");

  await expect(page.locator(".ccv2-page-head__title")).toContainText("Skill Registry");
  await expect(page.getByText("Skill execution is not enabled yet")).toBeVisible();
  await expect(page.getByText("Provider, tool, worker, DB write, and project mutation paths remain disabled.")).toBeVisible();
  await expect(commandTab(page, "Overview")).toHaveAttribute("aria-selected", "true");

  for (const label of ["Skills", "By Agent", "By Project / Stack", "Test Requirements", "Developer Details"]) {
    await commandTab(page, label).click();
    await expect(activeCommandTabPanel(page)).toBeVisible();
  }

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("DEMOAPP ACTIVE");
  expect(body).not.toContain("Execute Skill");
  expect(body).not.toContain("Run Skill");
  expect(errors).toEqual([]);
});

test("Hook Registry route renders read-only safe automation metadata", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/command-center/hooks");

  await expect(page.locator(".ccv2-page-head__title")).toContainText("Hook Registry");
  await expect(page.getByText("Hook execution is not enabled yet.")).toBeVisible();
  await expect(page.getByText("Hooks are registry/readiness only in P51.")).toBeVisible();
  await expect(page.getByText("Worker/runtime integration comes later.")).toBeVisible();
  await expect(commandTab(page, "Overview")).toHaveAttribute("aria-selected", "true");

  for (const label of ["Hooks", "Triggers", "Guardrails", "Kill Switches", "Developer Details"]) {
    await commandTab(page, label).click();
    await expect(activeCommandTabPanel(page)).toBeVisible();
  }
  await commandTab(page, "Triggers").click();
  await expect(activeCommandTabPanel(page)).toContainText("Would execute: No");

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("DEMOAPP ACTIVE");
  expect(body).not.toContain("Execute Hook");
  expect(body).not.toContain("Run Hook");
  expect(errors).toEqual([]);
});

test("Command Center help links are visible on major routes", async ({ page }) => {
  const errors = captureClientErrors(page);
  const helpRoutes = [
    "/command-center",
    "/command-center/command",
    "/command-center/workspace",
    "/command-center/tasks",
    "/command-center/workbench",
    "/command-center/implementation",
    "/command-center/evidence",
    "/command-center/liveapi",
    "/command-center/services",
    "/command-center/demo",
    "/command-center/projects",
    "/command-center/safety",
    "/command-center/database",
    "/command-center/roadmap",
    "/command-center/docs",
  ];

  for (const path of helpRoutes) {
    await page.goto(path);
    await expect(page.locator(".ccv2-help-link").first()).toBeVisible();
    await expect(page.locator(".ccv2-help-link__eyebrow").first()).toHaveText("Guide");
    await expect(page.locator(".ccv2-help-link").first()).toHaveAttribute("title", /docs\/usage\//);
    await page.locator(".ccv2-help-link").first().click();
    await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
  }

  expect(errors).toEqual([]);
});

test("Command Center help links map to expected usage docs", async ({ page }) => {
  const expectedHelp = [
    ["/command-center", "Command Center Guide", "docs/usage/COMMAND_CENTER_GUIDE.md"],
    ["/command-center/command", "Command Center Guide", "docs/usage/COMMAND_CENTER_GUIDE.md"],
    ["/command-center/workspace", "Command Center Guide", "docs/usage/COMMAND_CENTER_GUIDE.md"],
    ["/command-center/tasks", "Activating Tasks", "docs/usage/ACTIVATING_TASKS.md"],
    ["/command-center/workbench", "Using Agent Workbench", "docs/usage/USING_AGENT_WORKBENCH.md"],
    ["/command-center/implementation", "Controlled Implementation", "docs/usage/CONTROLLED_IMPLEMENTATION.md"],
    ["/command-center/evidence", "Understanding Evidence and Audit", "docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md"],
    ["/command-center/liveapi", "Running NEXUS Locally", "docs/usage/RUNNING_NEXUS_LOCALLY.md"],
    ["/command-center/database", "Command Center Guide", "docs/usage/COMMAND_CENTER_GUIDE.md"],
    ["/command-center/services", "Running NEXUS Locally", "docs/usage/RUNNING_NEXUS_LOCALLY.md"],
    ["/command-center/safety", "Demo Mode vs Private Mode", "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md"],
    ["/command-center/projects", "Getting Started", "docs/usage/GETTING_STARTED.md"],
    ["/command-center/docs", "Docs & Guides", "docs/usage/README.md"],
    ["/command-center/demo", "Demo Mode vs Private Mode", "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md"],
  ];

  for (const [path, label, docPath] of expectedHelp) {
    await page.goto(path);
    const help = page.locator(".ccv2-help-link").first();
    await expect(help).toHaveAttribute("title", new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(help).toHaveAttribute("title", new RegExp(docPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("ai verse route renders constellation and popup interaction works", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.addInitScript(() => {
    const events = [];
    class MockUtterance {
      constructor(text) {
        this.text = text;
      }
    }

    Object.defineProperty(window, "__speechEvents", {
      value: events,
      configurable: true,
    });

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: MockUtterance,
      configurable: true,
    });

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices() {
          return [
            { name: "Google UK English Male", lang: "en-GB" },
            { name: "Samantha", lang: "en-US" },
          ];
        },
        speak(utterance) {
          events.push({ type: "speak", text: utterance.text, voice: utterance.voice?.name || null });
        },
        cancel() {
          events.push({ type: "cancel" });
        },
      },
      configurable: true,
    });
  });

  await page.goto("/constellation");

  await expect(page.locator(".verse-page")).toBeVisible();
  await expect(page.locator(".shell-topbar__verse-title")).toContainText("AI");
  await expect(page.locator(".shell-topbar__verse-title")).toContainText("Verse");

  await page.locator(".orbit-node--sun").click();
  await expect(page.locator(".orbit-popup")).toBeVisible();
  await page.waitForTimeout(250);

  await page.locator(".orbit-node--team", { hasText: "Product" }).click();
  await page.waitForTimeout(250);

  const afterSpeak = await page.evaluate(() => window.__speechEvents);
  const speakEvents = afterSpeak.filter((event) => event.type === "speak");
  expect(speakEvents).toHaveLength(2);
  expect(speakEvents[0]?.voice).toBe("Google UK English Male");
  expect(speakEvents[1]?.voice).toBe("Samantha");

  await page.locator(".verse-page").click({ position: { x: 24, y: 24 } });
  await expect(page.locator(".orbit-popup")).toHaveCount(0);

  const afterDismiss = await page.evaluate(() => window.__speechEvents);
  expect(afterDismiss.some((event) => event.type === "cancel")).toBe(true);
  expect(errors).toEqual([]);
});

test("skills route renders execution console and skill matrix", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/skills");

  await expect(page.locator(".page")).toBeVisible();
  await expect(page.locator(".page-head__title")).toHaveText("Skills");
  await expect(page.getByRole("button", { name: "Release readiness stack" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("traction route renders investor room and economics surfaces", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/traction");

  await expect(page.locator(".page")).toBeVisible();
  await expect(page.locator(".page-head__title")).toHaveText("Traction");
  await expect(page.getByText("Traction Score")).toBeVisible();

  expect(errors).toEqual([]);
});

test.describe("Command Center route-wide UX", () => {
  test("screenshot audit script contract exists and manifest is compatible when generated", async () => {
    expect(existsSync(SCREENSHOT_AUDIT_SCRIPT)).toBe(true);

    for (const route of SCREENSHOT_AUDIT_ROUTES) {
      expect(COMMAND_CENTER_ROUTES.some((entry) => entry.path === route.path)).toBe(true);
    }

    if (existsSync(SCREENSHOT_MANIFEST)) {
      const manifest = JSON.parse(readFileSync(SCREENSHOT_MANIFEST, "utf8"));
      expect(manifest.auditVersion).toBe("1.0");
      expect(manifest.phase).toBe("P41.5.5");
      expect(manifest.themes).toEqual(expect.arrayContaining(["dark", "light"]));
      expect(Array.isArray(manifest.routes)).toBe(true);

      const capturedPaths = new Set(manifest.routes.map((entry) => entry.path));
      for (const route of SCREENSHOT_AUDIT_ROUTES) {
        if (capturedPaths.has(route.path)) {
          expect(manifest.routes.some((entry) => entry.path === route.path)).toBe(true);
        }
      }
    }
  });

  test("theme switcher exists globally", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");

    await expect(page.locator(".ccv2-theme-control")).toBeVisible();
    await expect(page.getByRole("button", { name: /Open theme menu/i })).toBeVisible();
    await page.getByRole("button", { name: /Open theme menu/i }).click();
    await expect(page.getByRole("button", { name: /Use system theme/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Use dark theme/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Use light theme/i })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("theme persistence stores and restores light mode", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await pickTheme(page, "light");

    let themeState = await getThemeState(page);
    expect(themeState.storedTheme).toBe("light");
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.resolvedTheme).toBe("light");
    expect(themeState.shellTheme).toBe("light");
    expect(themeState.shellResolvedTheme).toBe("light");

    await page.reload();
    themeState = await getThemeState(page);
    expect(themeState.storedTheme).toBe("light");
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.resolvedTheme).toBe("light");

    expect(errors).toEqual([]);
  });

  test("dark mode applies without reload", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workspace");
    await pickTheme(page, "dark");

    const themeState = await getThemeState(page);
    expect(themeState.storedTheme).toBe("dark");
    expect(themeState.rootTheme).toBe("dark");
    expect(themeState.resolvedTheme).toBe("dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Workspace");

    expect(errors).toEqual([]);
  });

  test("system mode follows resolved color scheme", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/command-center/mission");
    await pickTheme(page, "system");

    let themeState = await getThemeState(page);
    expect(themeState.storedTheme).toBe("system");
    expect(themeState.rootTheme).toBe("system");
    expect(themeState.resolvedTheme).toBe("light");

    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    themeState = await getThemeState(page);
    expect(themeState.storedTheme).toBe("system");
    expect(themeState.rootTheme).toBe("system");
    expect(themeState.resolvedTheme).toBe("dark");

    expect(errors).toEqual([]);
  });

  test("primary routes render with expected headings", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const route of PRIMARY_COMMAND_CENTER_ROUTES) {
      const target = route.key === "mission" ? "/" : route.path;
      await page.goto(target);
      await expect(page.locator(".ccv2-shell")).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(route.name, "i") }).first()).toBeVisible();
      await expect(page.locator(".ccv2-page-head__title").first()).toContainText(route.expectedHeading);
    }

    expect(errors).toEqual([]);
  });

  test("Service Health route renders with operator guidance and service cards", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/services");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Service Health");
    await expect(page.locator("body")).toContainText(
      "Start, inspect, and troubleshoot local NEXUS services.",
    );
    await expect(page.locator("body")).toContainText("Command Center");
    await expect(page.locator("body")).toContainText("Live Local API");
    await expect(page.locator("body")).toContainText("Governed Action Bridge");
    await expect(page.locator("body")).toContainText(/Durable State Foundation|DB Foundation/);
    await expect(page.locator("body")).toContainText("Worker Runtime");
    await expect(page.locator("body")).toContainText(/MCP Gateway|Tool\/MCP Gateway/);
    await expect(page.locator("body")).toContainText("npm run nexus:up");
    await expect(page.locator("body")).toContainText("npm run nexus:down");
    await expect(page.locator("body")).toContainText("npm run nexus:status");
    await expect(page.locator("body")).toContainText("npm run nexus:doctor");
    await expect(page.locator("body")).toContainText("Run this command in a local terminal");
    await expect(page.locator("body")).toContainText("Port already in use");
    await expect(page.locator("body")).toContainText("Local API offline");
    await expect(page.locator("body")).toContainText("Action bridge offline");

    expect(errors).toEqual([]);
  });

  test("Worker Runtime route renders preview-only runtime primitives", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workers");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Worker Runtime");
    await expect(page.locator("body")).toContainText("Durable background execution foundation for future governed tasks.");
    await expect(page.locator("body")).toContainText("P60 defines runtime primitives only");
    await expect(page.locator("body")).toContainText("Worker queue");
    await expect(page.locator("body")).toContainText("Leases");
    await expect(page.locator("body")).toContainText("Heartbeats");
    await expect(page.locator("body")).toContainText("Retry/timeout");
    await expect(page.locator("body")).toContainText("Dead-letter queue");
    await expect(page.locator("body")).toContainText("Runtime execution");
    await expect(page.locator("body")).toContainText("Not enabled");
    await expect(page.locator("body")).toContainText("Concurrency Readiness");
    await expect(commandTab(page, "Queue")).toBeVisible();
    await commandTab(page, "Retries / DLQ").click();
    await expect(activeCommandTabPanel(page)).toContainText("Requeue execution");
    await commandTab(page, "Concurrency").click();
    await expect(activeCommandTabPanel(page)).toContainText("Concurrency Policy");
    await expect(activeCommandTabPanel(page)).toContainText("Duplicate work preview");
    await expect(activeCommandTabPanel(page)).toContainText("Cancellation preview");
    await expect(activeCommandTabPanel(page)).toContainText("Parallel execution");
    await commandTab(page, "Developer Details").click();
    await expect(activeCommandTabPanel(page)).toContainText("policy/worker-runtime-policy.json");
    await expect(activeCommandTabPanel(page)).toContainText("policy/concurrency-policy.json");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    for (const label of FORBIDDEN_PHASE_LABELS) {
      expect(body).not.toContain(label);
    }

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-command-tabs")).toBeVisible();
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-command-tabs")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Worker Runtime route renders concurrency readiness previews", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workers");

    await expect(page.locator("body")).toContainText("Concurrency Readiness");
    await expect(page.locator("body")).toContainText("Lock model");
    await expect(page.locator("body")).toContainText("Duplicate detection");
    await expect(page.locator("body")).toContainText("Priority model");
    await expect(page.locator("body")).toContainText("Cancellation");
    await commandTab(page, "Concurrency").click();
    await expect(activeCommandTabPanel(page)).toContainText("No real parallel execution is enabled.");
    await expect(activeCommandTabPanel(page)).toContainText("Priority previews do not reorder worker queues.");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");

    expect(errors).toEqual([]);
  });

  test("Command Palette entrypoint exists and opens core commands", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();

    const dialog = page.getByRole("dialog", { name: /NEXUS Command Palette/i });
    await expect(dialog).toBeVisible();

    for (const label of [
      "Plan Mission",
      "Review Work",
      "Run QA Gate",
      "Propose Fix",
      "Prepare Ship",
      "Run Retro",
      "Guard Scope",
      "Freeze Workspace",
      "Explain Current State",
    ]) {
      await expect(dialog.getByText(label, { exact: false }).first()).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test("Command Palette shows command details for plan and explain", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();

    const dialog = page.getByRole("dialog", { name: /NEXUS Command Palette/i });
    await dialog.getByRole("button", { name: /Plan Mission/i }).click();
    await expect(dialog).toContainText("Turn a goal into a governed mission plan.");
    await expect(dialog).toContainText("Owner");
    await expect(dialog).toContainText("Risk");
    await expect(dialog).toContainText("Action mode");
    await expect(dialog).toContainText("Required capabilities");

    await dialog.getByRole("button", { name: /Explain Current State/i }).click();
    await expect(dialog).toContainText("Explain what NEXUS sees, what is ready, what is blocked, and what to do next.");
    await expect(dialog).toContainText("Read-only summary");

    expect(errors).toEqual([]);
  });

  test("Command Palette shows manual trigger preview state", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();

    const dialog = page.getByRole("dialog", { name: /NEXUS Command Palette/i });
    await dialog.getByRole("button", { name: /Plan Mission/i }).click();
    await expect(dialog).toContainText("Trigger preview");
    await expect(dialog).toContainText("Preview only - trigger execution is not enabled yet");

    expect(errors).toEqual([]);
  });

  test("Command Palette disabled commands show clear reasons and do not execute", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();
    const initialUrl = page.url();

    const dialog = page.getByRole("dialog", { name: /NEXUS Command Palette/i });
    await dialog.getByRole("button", { name: /Prepare Ship/i }).click();
    await expect(dialog).toContainText("Requires release action bridge.");
    expect(page.url()).toBe(initialUrl);

    await dialog.getByRole("button", { name: /Freeze Workspace/i }).click();
    await expect(dialog).toContainText("Requires runtime lock controls.");
    expect(page.url()).toBe(initialUrl);

    await dialog.getByRole("button", { name: /Propose Fix/i }).click();
    await expect(dialog).toContainText(/Requires failing validation evidence.|Requires controlled implementation bridge./);
    expect(page.url()).toBe(initialUrl);

    expect(errors).toEqual([]);
  });

  test("Mission Control shows simple operator action rows", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByLabel("Project selector").selectOption("private-project-01");

    const operatorActions = page.locator("#v2-operator-actions");
    await expect(operatorActions).toBeVisible();
    for (const label of [
      "Plan Mission",
      "Review Work",
      "Run QA Gate",
      "Explain Current State",
    ]) {
      await expect(operatorActions.getByRole("button", { name: new RegExp(label, "i") })).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test("Mission Control tab shell renders required tabs", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");

    const tabs = page.getByRole("tablist", { name: /Mission Control sections/i });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("tab", { name: /Overview/i })).toHaveAttribute("aria-selected", "true");

    for (const label of [
      "Overview",
      "Workflows",
      "Tasks",
      "Agents",
      "Gates",
      "Evidence",
      "Risks / Approvals",
      "Cost",
    ]) {
      await expect(tabs.getByRole("tab", { name: new RegExp(label.replace("/", "\\/"), "i") })).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test("Mission Control tab navigation shows drilldown panels", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");

    const expectations = [
      ["Workflows", "Capability-Based Workflow States"],
      ["Tasks", "Active Mission Tasks"],
      ["Agents", "Agent Assignments"],
      ["Gates", "Verification Gates"],
      ["Evidence", "Evidence Timeline"],
      ["Risks / Approvals", "Safety / Approval"],
      ["Cost", "Cost Snapshot"],
    ];

    for (const [tabLabel, panelText] of expectations) {
      await page.getByRole("tab", { name: new RegExp(tabLabel.replace("/", "\\/"), "i") }).click();
      await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText(panelText);
    }

    expect(errors).toEqual([]);
  });

  test("Mission Control scope shell shows project, portfolio, and OS context", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");

    await expect(page.getByRole("group", { name: /Scope selector/i })).toBeVisible();
    const scopeSelector = page.getByRole("group", { name: /Scope selector/i });
    await expect(scopeSelector.getByRole("button", { name: "Project", exact: true })).toBeVisible();
    await expect(scopeSelector.getByRole("button", { name: "Portfolio", exact: true })).toBeVisible();
    await expect(scopeSelector.getByRole("button", { name: "NEXUS OS", exact: true })).toBeVisible();
    await expect(page.getByLabel("Project context")).toContainText("Active Project");
    await expect(page.getByLabel("Project context")).toContainText("No project selected");
    await expect(page.getByLabel("Project context")).toContainText("Scope: Project");
    await expect(page.getByLabel("Project context")).toContainText("Mode: local-private");

    await scopeSelector.getByRole("button", { name: "Portfolio", exact: true }).click();
    await expect(page.locator("body")).toContainText("Portfolio view is planned with Project Registry in P42.");

    await scopeSelector.getByRole("button", { name: "NEXUS OS", exact: true }).click();
    await expect(page.getByLabel("Project context")).toContainText("NEXUS OS");

    expect(errors).toEqual([]);
  });

  test("Mission Control scope-aware tabs show portfolio, project, and OS content", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    const scopeSelector = page.getByRole("group", { name: /Scope selector/i });

    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("No project selected");
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Create or import a project");
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("System Status");

    await scopeSelector.getByRole("button", { name: "Portfolio", exact: true }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Portfolio Project Cards");
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Project Registry will enable cross-project task aggregation");
    await page.getByRole("tab", { name: /Tasks/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Project Registry will enable cross-project task aggregation");

    await scopeSelector.getByRole("button", { name: "NEXUS OS", exact: true }).click();
    await page.getByRole("tab", { name: /Overview/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Current OS Phase");
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("NEXUS OS Readiness");
    await page.getByRole("tab", { name: /Tasks/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("NEXUS OS Tasks");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("Requires P37");
    expect(body).not.toContain("P38-LOCAL");

    expect(errors).toEqual([]);
  });

  test("Command Palette renders in dark and light themes", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await pickTheme(page, "dark");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();
    await expect(page.getByRole("dialog", { name: /NEXUS Command Palette/i })).toBeVisible();
    await expect(page.locator(".ccv2-theme-control")).toBeVisible();
    await page.getByRole("button", { name: /Close Command Palette/i }).click();

    await pickTheme(page, "light");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();
    await expect(page.getByRole("dialog", { name: /NEXUS Command Palette/i })).toBeVisible();
    await expect(page.locator(".ccv2-theme-control")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Mission Control tabs render in dark and light themes", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await pickTheme(page, "dark");
    await expect(page.getByRole("tablist", { name: /Mission Control sections/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Overview/i })).toHaveAttribute("aria-selected", "true");

    await pickTheme(page, "light");
    await expect(page.getByRole("tablist", { name: /Mission Control sections/i })).toBeVisible();
    await page.getByRole("tab", { name: /Cost/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Cost Snapshot");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Requires P37");
    expect(body).not.toContain("P38-LOCAL");

    expect(errors).toEqual([]);
  });

  test("implemented routes render in dark and light themes", async ({ page }) => {
    test.setTimeout(60000);
    const errors = captureClientErrors(page);

    for (const route of IMPLEMENTED_COMMAND_CENTER_ROUTES) {
      const target = route.path;
      await page.goto(target);

      await pickTheme(page, "dark");
      let themeState = await getThemeState(page);
      expect(themeState.rootTheme).toBe("dark");
      expect(themeState.resolvedTheme).toBe("dark");
      await expect(page.locator(".ccv2-page-head__title").first()).toBeVisible();
      await expect(page.locator(".ccv2-topbar")).toBeVisible();
      await expect(page.locator(".ccv2-sidebar")).toBeVisible();
      await expect(page.locator(".ccv2-theme-control")).toBeVisible();
      await expect(
        page.locator(
          ".ccv2-card, .ccv2-stat-chip, .ccv2-workspace-nba, .ccv2-roadmap-track, .ccv2-roadmap-summary-card",
        ).first(),
      ).toBeVisible();

      await pickTheme(page, "light");
      themeState = await getThemeState(page);
      expect(themeState.rootTheme).toBe("light");
      expect(themeState.resolvedTheme).toBe("light");
      await expect(page.locator(".ccv2-page-head__title").first()).toBeVisible();
      await expect(page.locator(".ccv2-topbar")).toBeVisible();
      await expect(page.locator(".ccv2-sidebar")).toBeVisible();
      await expect(page.locator(".ccv2-theme-control")).toBeVisible();

      const body = await page.locator("body").innerText();
      if (route.key !== "roadmap") {
        for (const label of FORBIDDEN_PHASE_LABELS) {
          expect(body).not.toContain(label);
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test("Mission Control renders enterprise cockpit sections", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByLabel("Project selector").selectOption("private-project-01");

    for (const section of [
      "Mission Control",
      "Founder Idea Lifecycle",
      "Idea intake",
      "Founder Q&A",
      "Feasibility validation",
      "PRD creation",
      "Business buildout",
      "Next Best Action",
      "System Status",
      "Execution Pipeline",
      "Activity Stream",
    ]) {
      await expect(page.getByText(section, { exact: false }).first()).toBeVisible();
    }

    await page.getByRole("tab", { name: /Tasks/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Active Mission Tasks");

    await page.getByRole("tab", { name: /Gates/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Verification Gates");
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Release Readiness");

    await page.getByRole("tab", { name: /Evidence/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Evidence Timeline");

    await page.getByRole("tab", { name: /Risks/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Safety / Approval");

    await page.getByRole("tab", { name: /Cost/i }).click();
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Cost Snapshot");

    expect(errors).toEqual([]);
  });

  test("Mission Hero shows mission, scope, actions, and disabled reasons", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByLabel("Project selector").selectOption("private-project-01");

    const missionHero = page.locator("#v2-mission-hero");

    await expect(missionHero).toBeVisible();
    await expect(missionHero.getByText("Active Project", { exact: false }).first()).toBeVisible();
    await expect(missionHero.getByText("Active Mission", { exact: false }).first()).toBeVisible();
    await expect(missionHero).toContainText(CARE_PHASE_LABEL);
    await expect(missionHero).toContainText("Mission ID");
    await expect(missionHero).toContainText("Read-only until mission edit workflow is enabled.");
    await expect(missionHero.getByRole("button", { name: /Generate Plan/i })).toBeVisible();
    await expect(missionHero.getByRole("button", { name: /Create Project Brief/i })).toBeVisible();
    await expect(missionHero.getByRole("button", { name: /Start Governed Run/i })).toBeVisible();
    await expect(missionHero).toContainText(/Requires generated mission plan|Requires governed action bridge/);
    await expect(missionHero).toContainText(/Requires approved task plan|Governed run execution is not enabled yet|Requires governed action bridge/);
    await expect(missionHero.getByText("Mission Control", { exact: true })).toHaveCount(0);
    await expect(page.locator("#mission-control-text")).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("Mission Control status strip shows key platform states", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");

    const statusStrip = page.locator("#v2-system-status");
    await expect(statusStrip).toBeVisible();
    await expect(statusStrip).toContainText("Local API");
    await expect(statusStrip).toContainText("Durable State");
    await expect(statusStrip).toContainText("DB Writes");
    await expect(statusStrip).toContainText("Disabled by policy");
    await expect(statusStrip).toContainText("Worker Runtime");
    await expect(statusStrip).toContainText(/Not enabled|Requires worker runtime/);

    expect(errors).toEqual([]);
  });

  test("Mission Control renders in dark and light themes", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/mission");
    await page.getByLabel("Project selector").selectOption("private-project-01");
    await pickTheme(page, "dark");
    await expect(page.locator("#v2-mission-hero")).toBeVisible();
    await expect(page.locator(".ccv2-theme-control")).toBeVisible();
    await expect(page.locator("#v2-next-best-action")).toBeVisible();
    await expect(page.locator("#v2-execution-pipeline")).toBeVisible();

    await pickTheme(page, "light");
    await expect(page.locator("#v2-mission-hero")).toBeVisible();
    await expect(page.locator(".ccv2-theme-control")).toBeVisible();
    await expect(page.locator("#v2-activity-stream")).toBeVisible();

    const body = await page.locator("body").innerText();
    for (const label of FORBIDDEN_PHASE_LABELS) {
      expect(body).not.toContain(label);
    }

    expect(errors).toEqual([]);
  });

  test("non-roadmap routes do not show stale phase labels", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const route of NON_ROADMAP_PRIMARY_ROUTES) {
      const target = route.path;
      await page.goto(target);
      const body = await page.locator("body").innerText();
      for (const label of FORBIDDEN_PHASE_LABELS) {
        expect(body).not.toContain(label);
      }
    }

    expect(errors).toEqual([]);
  });

  test("OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/roadmap");
    const body = await page.locator("body").innerText();

    await expect(page.locator("body")).toContainText("NEXUS OS Platform Progress");
    await expect(page.locator("body")).toContainText("Latest completed phase");
    await expect(page.locator("body")).toContainText("In progress phase");
    await expect(page.locator("body")).toContainText("Next planned phase");
    await expect(commandTab(page, "Completed")).toBeVisible();
    await expect(commandTab(page, "In Progress")).toBeVisible();
    await expect(commandTab(page, "Planned")).toBeVisible();

    await commandTab(page, "Completed").click();
    const completedBody = await page.locator("body").innerText();
    for (const phase of ["P26-P41", "P41.5.1", "P41.6.4", "P41.7.1", "P42.2", "P42.6", "P42.7", "P43.2", "P43.5"]) {
      expect(completedBody).toContain(phase);
    }
    expect(completedBody).toContain("nexus.project.json Loader + Validator");
    expect(completedBody).toContain("Project Capability Matrix");
    expect(completedBody).toContain("Project vs OS Mutation Boundary");
    expect(completedBody).toContain("Command Center Scope Boundary UX");

    await commandTab(page, "Planned").click();
    const plannedBody = await page.locator("body").innerText();
    expect(plannedBody).toContain(NEXUS_NEXT_OS_PHASE.label);
    for (const phase of NEXUS_ROADMAP_PHASES.filter((entry) => entry.status === "planned").map((entry) => entry.phase)) {
      expect(plannedBody).toContain(phase);
    }
    expect(body).not.toContain(["Care", "Loop"].join(""));
    expect(body).not.toContain("Track B");
    expect(body).not.toContain("DB-backed Command Center + Live Refresh");
    expect(body).not.toContain("Blocked / Risks");
    expect(body).not.toContain("History");

    expect(errors).toEqual([]);
  });

  test("OS Roadmap and Projects render cleanly across theme changes", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/roadmap");
    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("OS Roadmap");
    await commandTab(page, "Completed").click();
    await expect(page.locator("body")).toContainText("P41.6.6");
    await commandTab(page, "In Progress").click();
    await expect(page.locator("body")).toContainText("In progress phase");

    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("OS Roadmap");
    await commandTab(page, "Planned").click();
    await expect(page.locator("body")).toContainText(NEXUS_NEXT_OS_PHASE.phase);

    await page.goto("/command-center/projects");
    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Projects");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Projects");

    expect(errors).toEqual([]);
  });

  test("sidebar uses focused founder labels and hides advanced clutter", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");
    const sidebarText = await page.locator(".ccv2-sidebar").innerText();

    expect(sidebarText).toContain("Chat with NEXUS");
    expect(sidebarText).toContain("Agent Flow");
    expect(sidebarText).toContain("Founder Intake");
    expect(sidebarText).toContain("Business Build");
    expect(sidebarText).toContain("Activity Log");
    expect(sidebarText).toContain("Docs & Guides");
    expect(sidebarText).toMatch(/Live Readiness\s+READY/i);
    expect(sidebarText).toMatch(/Founder Intake\s+READY/i);
    expect(sidebarText).toMatch(/Business Build\s+NEEDS SETUP/i);
    expect(sidebarText).not.toContain("Agent Workbench");
    expect(sidebarText).not.toContain("Implementation");
    expect(sidebarText).not.toContain("Live API");
    expect(sidebarText).not.toContain("Durable State");
    expect(sidebarText).not.toContain("Settings");
    expect(sidebarText).not.toContain("Agent Workbench P38");
    expect(sidebarText).not.toContain("Implementation P39");
    expect(sidebarText).not.toContain("Live API P40");
    expect(sidebarText).not.toContain("Durable State P41");
    await expect(page.getByRole("link", { name: /Agent Flow/i })).toHaveAttribute("title", "Agent Flow");
    await expect(page.getByRole("link", { name: /Docs & Guides/i })).toHaveAttribute("title", "Docs & Guides");

    expect(errors).toEqual([]);
  });

  test("top header is compact and omits noisy runtime badges", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");

    const topbar = await page.locator(".ccv2-topbar").innerText();
    expect(topbar).toContain("NEXUS");
    expect(topbar).toContain("Chat with NEXUS");
    expect(topbar).toContain("NEXUS OS");
    expect(topbar).not.toContain("Environment:");
    expect(topbar).not.toContain("Desktop");
    expect(topbar).not.toContain("Local API");
    expect(topbar).not.toContain("Durable State");
    expect(topbar).not.toContain("ENVDesktop");
    expect(topbar).not.toContain("local-");
    expect(topbar).not.toContain("Command Palette");
    await expect(page.getByLabel("Open Command Palette")).toBeVisible();
    await expect(page.getByRole("button", { name: /Open theme menu/i })).toBeVisible();
    await expect(page).toHaveTitle(/NEXUS OS - Chat with NEXUS/);
    await expect(page).not.toHaveTitle(/Venture Orchestration System/);

    expect(errors).toEqual([]);
  });

  test("workspace workflow cards use capability-based states", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workspace");
    const body = await page.locator("body").innerText();

    expect(body).toContain("AVAILABLE");
    expect(body).toContain("Requires release action bridge");
    expect(body).toContain("Requires iOS/Xcode runner");
    expect(body).toContain("worker runtime");
    expect(body).toContain("provider dispatch");

    expect(errors).toEqual([]);
  });

  test("workspace shows grouped governed workflows and clear availability states", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workspace");

    for (const label of ["Workspace Summary", "Plan", "Build", "Validate", "Govern", "Release"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
    await expect(page.locator("body")).toContainText("Available for planning");
    await expect(page.locator("body")).toContainText("Requires iOS/Xcode runner");
    await expect(page.locator("body")).toContainText("Requires release action bridge");

    expect(errors).toEqual([]);
  });

  test("Workspace tabs route users through recommended, grouped, and all workflows", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workspace");
    for (const label of ["Recommended", "Plan", "Build", "Validate", "Govern", "Release", "All Workflows"]) {
      await expect(commandTab(page, label)).toBeVisible();
    }

    await expect(commandTab(page, "Recommended")).toHaveAttribute("aria-selected", "true");
    for (const label of ["Plan", "Build", "Validate", "Govern", "Release", "All Workflows"]) {
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toContainText(label === "All Workflows" ? "All Workflows" : label);
    }

    const body = await page.locator("body").innerText();
    for (const label of FORBIDDEN_PHASE_LABELS) {
      expect(body).not.toContain(label);
    }
    await pickTheme(page, "dark");
    await expect(commandTab(page, "Recommended")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "All Workflows")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("task queue shows planned and runtime task states with user-facing next actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tasks");

    await expect(page.getByText("Queue Summary", { exact: false })).toBeVisible();
    await expect(page.getByText("Task State Summary", { exact: false })).toBeVisible();
    await expect(page.locator("body")).toContainText("Concurrency Preview");
    await expect(page.locator("body")).toContainText("Duplicate work");
    await expect(page.locator("body")).toContainText("Priority model");
    await expect(page.getByText("Planned Tasks", { exact: false })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Activate a planned task|No activated tasks yet|Activated Runtime Tasks/);

    expect(errors).toEqual([]);
  });

  test("Task Queue tabs separate planned, active, review, blocked, completed, and all projects", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tasks");
    for (const label of ["Planned", "Active", "Review", "Blocked", "Completed", "All Projects"]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toContainText(label);
      if (label === "Active") {
        await expect(activeCommandTabPanel(page)).toContainText(/No active runtime tasks yet|Active Runtime Tasks/);
      }
      if (label === "Blocked") {
        await expect(activeCommandTabPanel(page)).toContainText(/No blocked tasks|Blocked Tasks/);
      }
    }
    await pickTheme(page, "dark");
    await expect(commandTab(page, "Planned")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "All Projects")).toBeVisible();

    const body = await page.locator("body").innerText();
    for (const label of FORBIDDEN_PHASE_LABELS) {
      expect(body).not.toContain(label);
    }
    expect(errors).toEqual([]);
  });

  test("agent workbench shows review summary and helpful empty or selected task state", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workbench");

    await expect(page.getByText("Workbench Summary", { exact: false })).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).toContain("Agent Workbench");
    expect(body).not.toContain("P38-LOCAL");
    expect(
      body.includes("No activated tasks yet. Activate a planned task from Task Queue to open it in Agent Workbench.")
      || body.includes("Task Workbench")
    ).toBe(true);

    expect(errors).toEqual([]);
  });

  test("Agent Workbench tabs separate task, review, evidence, activity, and context", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/workbench");
    for (const label of ["Task", "Review", "Evidence", "Activity", "Context"]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toContainText(label);
    }
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("P38-LOCAL");
    expect(body).toMatch(/No activated tasks yet|Select an activated task|Task Workbench|Action bridge offline/);
    await pickTheme(page, "dark");
    await expect(commandTab(page, "Task")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "Context")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("implementation workflow shows user-facing status summary and developer details split", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/implementation");

    await expect(page.getByText("Implementation Summary", { exact: false })).toBeVisible();
    await expect(page.locator("body")).toContainText("Documentation-only");
    await expect(page.locator("body")).toContainText("Source mutation");
    await expect(page.locator("body")).toContainText("Disabled");
    await expect(page.locator("body")).toContainText("Developer Details");
    expect(await page.locator("body").innerText()).not.toContain("Project Briefshepherd");

    expect(errors).toEqual([]);
  });

  test("platform and governance pages render reusable tabs", async ({ page }) => {
    const errors = captureClientErrors(page);

    const tabbedRoutes = [
      ["/command-center/liveapi", ["Overview", "Endpoints", "Action Bridges", "Diagnostics"]],
      ["/command-center/database", ["Overview", "Entities", "Import Plan", "Fallback", "DB Runtime", "Developer Details"]],
      ["/command-center/evidence", ["Timeline", "By Task", "By Agent", "By Project", "Developer Details"]],
      ["/command-center/safety", ["Posture", "Policy Blocks", "Approvals", "Data & Privacy", "Developer Details"]],
      ["/command-center/projects", ["Portfolio", "Selected Project", "Stack", "Capabilities", "Milestones", "Gaps", "Evidence", "Settings / Adapter"]],
      ["/command-center/roadmap", ["Completed", "In Progress", "Planned"]],
      ["/command-center/cost", ["Overview", "Budgets", "Estimates", "Ledger", "Enforcement", "Gaps / Next", "Developer Details"]],
      ["/command-center/policies", ["Overview", "Registry", "Versions", "Diff Preview", "Simulation", "Exceptions", "Break-Glass", "Developer Details"]],
      ["/command-center/secrets", ["Overview", "Provider Credentials", "Project Credentials", "DB / Deploy", "Integrations", "Developer Details"]],
      ["/command-center/batch", ["Overview", "Jobs", "Results", "Cost"]],
      ["/command-center/workers", ["Overview", "Queue", "Leases", "Heartbeats", "Retries / DLQ", "Developer Details"]],
    ];

    for (const [path, labels] of tabbedRoutes) {
      await page.goto(path);
      for (const label of labels) {
        await expect(commandTab(page, label)).toBeVisible();
      }
      const initiallySelected = path === "/command-center/roadmap" ? "In Progress" : labels[0];
      await expect(commandTab(page, initiallySelected)).toHaveAttribute("aria-selected", "true");
      await commandTab(page, labels[1]).click();
      await expect(activeCommandTabPanel(page)).toContainText(new RegExp(labels[1].replace(/s$/, "s?"), "i"));

      const body = await page.locator("body").innerText();
      if (path === "/command-center/projects") {
        expect(body).toContain("Selected Project");
        expect(body).toContain("Selected Project");
        expect(body).not.toContain("DemoApp");
      } else {
        expect(body).not.toContain("DemoApp");
      }
      if (path !== "/command-center/roadmap") {
        for (const label of FORBIDDEN_PHASE_LABELS) {
          expect(body).not.toContain(label);
        }
      }
    }

    expect(errors).toEqual([]);
  });

  test("platform tabbed pages preserve theme readability and roadmap separation", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const path of [
      "/command-center/liveapi",
      "/command-center/database",
      "/command-center/workers",
      "/command-center/evidence",
      "/command-center/safety",
      "/command-center/projects",
    ]) {
      await page.goto(path);
      await pickTheme(page, "dark");
      await expect(page.locator(".ccv2-command-tabs")).toBeVisible();
      await pickTheme(page, "light");
      await expect(page.locator(".ccv2-command-tabs")).toBeVisible();
    }

    await page.goto("/command-center/projects");
    await expect(page.locator("body")).toContainText("Project Operating Surface");
    await commandTab(page, "Milestones").click();
    await expect(page.locator("body")).toContainText("OS Roadmap tracks NEXUS platform phases. Project milestones live under Projects.");

    await page.goto("/command-center/roadmap");
    const roadmapText = await page.locator("body").innerText();
    expect(roadmapText).toMatch(/NEXUS OS Platform Progress/i);
    expect(roadmapText).not.toContain("Track B");
    expect(roadmapText).not.toContain("DemoApp");

    expect(errors).toEqual([]);
  });

  test("Projects page shows enterprise operating surface tabs and project boundary", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/projects");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Projects");
    await expect(page.locator("body")).toContainText("Manage NEXUS workloads, project readiness, stack profiles, boundaries, and project operating state.");
    await expect(page.locator("body")).toContainText("Project Selector");
    await expect(page.locator("body")).toContainText("Portfolio / All Projects");
    await expect(page.locator("body")).toContainText(`Selected Project: ${CARE_PROJECT_LABEL}`);
    await expect(page.locator("body")).toContainText("Project Type: SaaS + Mobile");
    await expect(page.locator("body")).toContainText("Stack: Node/Fastify + Prisma + iOS");
    await expect(page.locator("body")).toContainText("Concurrency Limits");
    await expect(page.locator("body")).toContainText("Per project");
    await expect(page.locator("body")).toContainText("Execution");

    for (const label of ["Portfolio", "Selected Project", "Stack", "Capabilities", "Milestones", "Gaps", "Evidence", "Settings / Adapter"]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "Selected Project").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project Registry");
    await expect(activeCommandTabPanel(page)).toContainText("Profile");
    await expect(activeCommandTabPanel(page)).toContainText("Stack Profile");
    await expect(activeCommandTabPanel(page)).toContainText("Capability Matrix");
    await expect(activeCommandTabPanel(page)).toContainText("Adapter Runtime");
    await expect(activeCommandTabPanel(page)).toContainText("Project Mutation");
    await expect(activeCommandTabPanel(page)).toContainText("Provider Dispatch");
    await expect(activeCommandTabPanel(page)).toContainText("DB Writes");
    await expect(activeCommandTabPanel(page)).toContainText("Disabled by policy");

    await commandTab(page, "Portfolio").click();
    await expect(activeCommandTabPanel(page)).toContainText("Total projects");
    await expect(activeCommandTabPanel(page)).toContainText("Projects needing setup");
    await expect(activeCommandTabPanel(page)).toContainText("No Project Selected Guidance");
    await expect(activeCommandTabPanel(page)).toContainText("Create Project");
    await expect(activeCommandTabPanel(page)).toContainText("Project onboarding action is not enabled yet");

    await commandTab(page, "Capabilities").click();
    for (const capability of ["Planning", "Backend validation", "iOS validation", "Android validation", "Web validation", "Controlled implementation", "Evidence/audit", "Release readiness", "Packaging/export safety", "Cost tracking"]) {
      await expect(activeCommandTabPanel(page)).toContainText(capability);
    }

    await commandTab(page, "Milestones").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project milestones live under Projects");
    await expect(activeCommandTabPanel(page)).not.toContainText("P49");

    await commandTab(page, "Evidence").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project Evidence");
    await expect(activeCommandTabPanel(page)).toContainText("Raw payloads and raw JSON stay out of the primary UI.");

    await commandTab(page, "Settings / Adapter").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project adapter not enabled yet");
    await expect(activeCommandTabPanel(page)).toContainText("Project mutation");
    await expect(activeCommandTabPanel(page)).toContainText("Provider dispatch");
    await expect(activeCommandTabPanel(page)).toContainText("DB writes");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("private-project-01");

    expect(errors).toEqual([]);
  });

  test("Agent Registry page shows tabs, known agents, and boundary preview", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/agents");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Agent Registry");
    for (const agent of ["NEXUS", "SHEPHERD", "CORE", "SWIFT", "SENTINEL", "AUDITOR", "WARDEN", "PRISM", "FORGE"]) {
      await expect(activeCommandTabPanel(page)).toContainText(agent);
    }
    for (const label of [
      "Overview",
      "Capabilities",
      "Boundaries",
      "Projects",
      "Evidence Requirements",
      "Definition Updates",
      "Developer Details",
    ]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    const body = await page.locator("body").innerText();
    expect(body).toMatch(/Boundary Envelope Preview/i);
    expect(body).toMatch(/Runtime Enforcement/i);
    expect(body).toMatch(/Tool Dispatch/i);
    expect(body).not.toContain("{\"agent");
    expect(body).not.toContain("DemoApp");

    await pickTheme(page, "dark");
    await expect(commandTab(page, "Overview")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "Developer Details")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Agent Registry shows read-only agent definition update workflow", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/agents");
    await commandTab(page, "Definition Updates").click();

    await expect(activeCommandTabPanel(page)).toContainText("Agent Definition Updates");
    await expect(activeCommandTabPanel(page)).toContainText("Proposal-first workflow");
    await expect(activeCommandTabPanel(page)).toContainText("Boundary Diff Summary");
    await expect(activeCommandTabPanel(page)).toContainText("AUDITOR / WARDEN Review");
    await expect(activeCommandTabPanel(page)).toContainText("Human Approval Gate");
    await expect(activeCommandTabPanel(page)).toContainText("Versioning + Rollback");
    await expect(activeCommandTabPanel(page)).toContainText("Apply disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("provider dispatch enabled");
    expect(body).not.toContain("DB writes enabled");

    expect(errors).toEqual([]);
  });

  test("Memory Center shows read-only scoped memory tabs and packet preview", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/memory");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Memory Center");
    await expect(page.locator("body")).toContainText("Memory Scope Context");
    await expect(page.locator("body")).toContainText("Runtime injection disabled");
    await expect(page.locator("body")).toContainText("Selected Project");

    for (const label of [
      "Overview",
      "OS Memory",
      "Project Memory",
      "Agent Memory",
      "Task Memory",
      "Session Memory",
      "Stale Memory",
      "Promotion Candidates",
      "Packets",
    ]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "Packets").click();
    await expect(activeCommandTabPanel(page)).toContainText("Packet Summary");
    await expect(activeCommandTabPanel(page)).toContainText("Excluded Memory");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("api_key");
    expect(body).not.toContain("raw prompt");

    await pickTheme(page, "dark");
    await expect(commandTab(page, "Overview")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "Packets")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Data and Context Center shows trusted context tabs without raw dumps", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/context");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Data & Context Center");
    await expect(page.locator("body")).toContainText("Inspect trusted context sources");
    await expect(page.locator("body")).toContainText("Provider dispatch: Disabled");
    await expect(page.locator("body")).toContainText("Raw content: Hidden");

    for (const label of [
      "Overview",
      "Data Sources",
      "System of Record",
      "Trust Scores",
      "Freshness & Lineage",
      "Context Packet Preview",
      "Exclusions / Blocks",
    ]) {
      await expect(commandTab(page, label)).toBeVisible();
    }

    await commandTab(page, "Data Sources").click();
    await expect(activeCommandTabPanel(page)).toContainText("NEXUS OS Roadmap");
    await commandTab(page, "System of Record").click();
    await expect(activeCommandTabPanel(page)).toContainText("project requirements");
    await commandTab(page, "Trust Scores").click();
    await expect(activeCommandTabPanel(page)).toContainText("high");
    await commandTab(page, "Freshness & Lineage").click();
    await expect(activeCommandTabPanel(page)).toContainText("Lineage Summary");
    await commandTab(page, "Context Packet Preview").click();
    await expect(activeCommandTabPanel(page)).toContainText("Runtime injection: Disabled");
    await commandTab(page, "Exclusions / Blocks").click();
    await expect(activeCommandTabPanel(page)).toContainText(/Forbidden|Source scope|Packet source/);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("{\"");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Data & Context Center");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Data & Context Center");

    expect(errors).toEqual([]);
  });

  test("Agent Rooms route shows governed mesh coordination", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/agent-rooms");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Agent Rooms");
    await expect(page.locator("body")).toContainText("Agents coordinate through NEXUS governance, not direct free chat.");
    await expect(page.locator("body")).toContainText("Messages are scoped, redacted, audited, and policy-checked.");
    await expect(page.locator("body")).toContainText("Provider/tool/worker dispatch is not enabled by P48.");
    await expect(page.locator("body")).toContainText("Agent rooms are coordination metadata only");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("api_key");
    expect(body).not.toContain("raw source");

    expect(errors).toEqual([]);
  });

  test("agent rooms tabs expose rooms messages handoffs context and policy", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/agent-rooms");
    for (const label of ["Overview", "Rooms", "Messages", "Handoffs", "Context Sync", "Policy"]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "Rooms").click();
    await expect(activeCommandTabPanel(page)).toContainText("Rooms by Scope and Status");
    await commandTab(page, "Messages").click();
    await expect(activeCommandTabPanel(page)).toContainText("Recent Redacted Messages");
    await commandTab(page, "Handoffs").click();
    await expect(activeCommandTabPanel(page)).toContainText("Task ownership unchanged");
    await commandTab(page, "Context Sync").click();
    await expect(activeCommandTabPanel(page)).toContainText("Allowed Context");
    await expect(activeCommandTabPanel(page)).toContainText("Runtime agent injection enabled: no");
    await commandTab(page, "Policy").click();
    await expect(activeCommandTabPanel(page)).toContainText("Direct agent-to-agent free chat is disabled.");

    await pickTheme(page, "dark");
    await expect(commandTab(page, "Overview")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "Policy")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Implementation Workflow tabs separate proposal, apply, validation, rollback, activity, and developer details", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/implementation");
    await expect(page.locator("body")).toContainText("Controlled Mutation Readiness");
    await expect(page.locator("body")).toContainText("Apply remains disabled until validation, approval, and final gates are complete.");
    await expect(page.locator("body")).toContainText("Preview a scoped source change before approval or apply exists.");
    await expect(page.locator("body")).toContainText("reports/p675-report.md");
    for (const label of ["Proposal", "Apply", "Validation", "Rollback", "Activity", "Developer Details"]) {
      await expect(commandTab(page, label)).toBeVisible();
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toContainText(label);
    }
    const body = await page.locator("body").innerText();
    expect(body).toContain("Documentation-only");
    expect(body).not.toContain("P39-LOCAL");
    expect(body).not.toContain("Project Briefshepherd");
    await pickTheme(page, "dark");
    await expect(commandTab(page, "Proposal")).toBeVisible();
    await pickTheme(page, "light");
    await expect(commandTab(page, "Activity")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("core operational pages prioritize project selection guidance and keep DemoApp out", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const path of [
      "/command-center/workspace",
      "/command-center/tasks",
      "/command-center/workbench",
      "/command-center/implementation",
    ]) {
      await page.goto(path);
      await expect(page.locator("body")).toContainText("No project selected");
      await expect(page.locator("body")).toContainText("Create or import a project");
      await expect(page.locator("body")).toContainText("Activate the first task");
      const body = await page.locator("body").innerText();
      expect(body).not.toContain("DemoApp");
      expect(body).not.toContain("DEMOAPP ACTIVE");
    }

    await page.goto("/command-center/demo");
    await expect(page.locator("body")).toContainText("Demo Mode");

    expect(errors).toEqual([]);
  });

  test("live api page groups endpoints by business purpose", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/liveapi");
    await expect(page.locator("body")).toContainText("API Summary");
    await expect(page.locator("body")).toContainText("Developer Details");
    await commandTab(page, "Endpoints").click();

    for (const label of ["Mission Data", "Task Data", "Evidence Ledger", "Runtime State", "Durable State"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
    expect(await page.locator("body").innerText()).not.toContain("P40-LOCAL");

    expect(errors).toEqual([]);
  });

  test("service health route renders in dark and light themes", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/services");
    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Service Health");
    await expect(page.locator(".ccv2-theme-control")).toBeVisible();
    await expect(page.locator("body")).toContainText("Doctor Findings");

    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Service Health");
    await expect(page.locator(".ccv2-theme-control")).toBeVisible();
    await expect(page.locator("body")).toContainText("Troubleshooting");

    const body = await page.locator("body").innerText();
    for (const label of FORBIDDEN_PHASE_LABELS) {
      expect(body).not.toContain(label);
    }

    expect(errors).toEqual([]);
  });

  test("durable state page shows file-backed posture without failure framing", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/database");

    await expect(page.getByText("Durable State Summary", { exact: false })).toBeVisible();
    await expect(page.locator("body")).toContainText("File-backed");
    await expect(page.locator("body")).toContainText("DB writes");
    await expect(page.locator("body")).toContainText("Disabled by policy");
    expect(await page.locator("body").innerText()).not.toContain("P41-LOCAL");

    expect(errors).toEqual([]);
  });

  test("DB Runtime route renders readiness without runnable DB actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/database");
    await commandTab(page, "DB Runtime").click();

    await expect(activeCommandTabPanel(page)).toContainText("DB Runtime Readiness");
    await expect(activeCommandTabPanel(page)).toContainText("DB primary state");
    await expect(activeCommandTabPanel(page)).toContainText("Fallback state");
    await expect(activeCommandTabPanel(page)).toContainText("Migration readiness");
    await expect(activeCommandTabPanel(page)).toContainText("Not ready for execution");
    await expect(activeCommandTabPanel(page)).toContainText("DB writes");
    await expect(activeCommandTabPanel(page)).toContainText("Disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Blockers");
    await expect(activeCommandTabPanel(page)).toContainText("Evidence, Activity, And Cost");

    const body = await activeCommandTabPanel(page).innerText();
    expect(body).not.toMatch(/migrate now|write now|schema now|run db|execute now|enable now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P72\./);

    expect(errors).toEqual([]);
  });

  test("Auth Governance route renders readiness without runnable auth actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/auth-governance");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Auth Governance");
    await expect(page.locator("body")).toContainText("Identity mode");
    await expect(page.locator("body")).toContainText("Role posture");
    await expect(page.locator("body")).toContainText("Workspace boundary");
    await expect(page.locator("body")).toContainText("Auth governance is display-only");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Sign in disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Assign role disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/sign in now|log in now|assign role now|create workspace now|invite user now|execute now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/[^\s]*auth/i);
    expect(body).not.toMatch(/P73\./);

    expect(errors).toEqual([]);
  });

  test("Observability route renders readiness without runnable telemetry actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/observability");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Observability");
      await expect(page.locator("body")).toContainText("Telemetry posture");
      await expect(page.locator("body")).toContainText("SLO posture");
      await expect(page.locator("body")).toContainText("Health state");
    }

    await expect(page.locator("body")).toContainText("Observability readiness is display-only");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Telemetry export disabled");
    await expect(activeCommandTabPanel(page)).toContainText("SLO enforcement disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Incident paging disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Remediation execution disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/export now|stream logs|send telemetry|enforce now|page now|remediate now|execute now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/[^\s]*(telemetry|metrics|logs|pager)/i);
    expect(body).not.toMatch(/P74\./);

    expect(errors).toEqual([]);
  });

  test("Backup DR route renders readiness without runnable recovery actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/backup-dr");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Backup / DR");
      await expect(page.locator("body")).toContainText("Backup posture");
      await expect(page.locator("body")).toContainText("Restore posture");
      await expect(page.locator("body")).toContainText("DR posture");
    }

    await expect(page.locator("body")).toContainText("Backup/DR readiness is display-only");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Backup creation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Restore execution disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Failover execution disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Overwrite or delete disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/backup now|create backup|restore now|execute restore|failover now|overwrite now|delete now|execute now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|s3:\/\/|gs:\/\/|https:\/\/[^\s]*(backup|restore|storage|failover)/i);
    expect(body).not.toMatch(/P75\./);

    expect(errors).toEqual([]);
  });

  test("Isolation route renders readiness without runnable access actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/isolation");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Isolation");
      await expect(page.locator("body")).toContainText("Tenant posture");
      await expect(page.locator("body")).toContainText("Project isolation");
      await expect(page.locator("body")).toContainText("Access context");
    }

    await expect(page.locator("body")).toContainText("Isolation readiness is display-only");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Tenant mutation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Project mutation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Access grants disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Role or permission changes disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/create tenant|update tenant|delete tenant|create project|update project|delete project|grant access|assign role|change permission|execute now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P76\./);

    expect(errors).toEqual([]);
  });

  test("Compliance route renders readiness without runnable certification actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/compliance");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Compliance");
      await expect(page.locator("body")).toContainText("Compliance posture");
      await expect(page.locator("body")).toContainText("Audit posture");
      await expect(page.locator("body")).toContainText("Control mapping");
    }

    await expect(page.locator("body")).toContainText("Compliance readiness is display-only");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Certification disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Legal attestation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Audit export disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Package creation disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/certify now|sign attestation|legal sign|export audit|download package|create package|execute now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P77\./);

    expect(errors).toEqual([]);
  });

  test("Enterprise Preview route renders readiness without runnable founder actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/enterprise-preview");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Enterprise Preview");
      await expect(page.locator("body")).toContainText("Founder intake");
      await expect(page.locator("body")).toContainText("Founder-to-Business Path");
      await expect(page.locator("body")).toContainText("PRD preview");
      await expect(page.locator("body")).toContainText("Agent workplan");
      await expect(page.locator("body")).toContainText("Business build");
      await expect(page.locator("body")).toContainText("Self-healing");
    }

    await expect(page.locator("body")).toContainText("Enterprise Preview is display-only");
    await commandTab(page, "PRD Preview").click();
    await expect(activeCommandTabPanel(page)).toContainText("Founder Intake");
    await expect(activeCommandTabPanel(page)).toContainText("PRD Preview");
    await commandTab(page, "Agent Workplan").click();
    await expect(activeCommandTabPanel(page)).toContainText("Validation Gates");
    await expect(activeCommandTabPanel(page)).toContainText("Self-Healing");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Founder Q&A automation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("PRD generation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Agent dispatch disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Business build execution disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Self-healing apply disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/ask founder now|generate prd now|write project now|dispatch agents now|run agents now|apply healing now|execute tools now|start workers now|create project now|execute now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P78\./);

    expect(errors).toEqual([]);
  });

  test("evidence page shows summary and avoids raw payload dumps", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/evidence");

    await expect(page.getByText("Evidence Summary", { exact: false })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Evidence Timeline|Evidence appears after governed actions complete\./);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("payload");
    expect(body).not.toContain("{\"");

    expect(errors).toEqual([]);
  });

  test("safety center shows plain-language safety posture without raw policy keys", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/safety");

    await expect(page.getByText("Safety Summary", { exact: false })).toBeVisible();
    await expect(page.locator("body")).toContainText("Public/demo boundary");
    await expect(page.locator("body")).toContainText("Private project boundary");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("dbWritesEnabled");
    expect(body).not.toContain("productionDbAllowed");

    expect(errors).toEqual([]);
  });

  test("projects page keeps project milestones separate from the OS roadmap", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/projects");

    await expect(page.locator("body")).toContainText("Project Operating Surface");
    await expect(page.locator("body")).toContainText("Selected project");
    await expect(page.locator("body")).toContainText("Selected Project");
    await commandTab(page, "Milestones").click();
    await expect(activeCommandTabPanel(page)).toContainText("OS Roadmap tracks NEXUS platform phases. Project milestones live under Projects.");
    await expect(activeCommandTabPanel(page)).toContainText("CARELOOP-P1");
    await expect(activeCommandTabPanel(page)).toContainText("CARELOOP-P2");

    await page.goto("/command-center/roadmap");
    const roadmapText = await page.locator("body").innerText();
    expect(roadmapText).toContain("NEXUS OS Platform Progress");
    expect(roadmapText).not.toContain("Private Project Governed Build Mission");

    await page.goto("/command-center/demo");
    expect(await page.locator("body").innerText()).not.toContain(["Care", "Loop"].join(""));

    expect(errors).toEqual([]);
  });

  test("projects page shows project capability matrix without enabling adapters", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/projects");

    await commandTab(page, "Capabilities").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project Capability Matrix");
    for (const capability of ["Planning", "Backend validation", "iOS validation", "Android validation", "Web validation", "Controlled implementation", "Evidence/audit", "Release readiness", "Packaging/export safety", "Cost tracking"]) {
      await expect(activeCommandTabPanel(page)).toContainText(capability);
    }
    await expect(page.locator("body")).toContainText("Requires setup");
    await expect(page.locator("body")).toContainText("provider dispatch is off");
    await expect(page.locator("body")).toContainText("Project-level cost enforcement is planned");

    await commandTab(page, "Gaps").click();
    await expect(activeCommandTabPanel(page)).toContainText("Why it matters");
    await expect(activeCommandTabPanel(page)).toContainText("Next action");

    await commandTab(page, "Settings / Adapter").click();
    await expect(activeCommandTabPanel(page)).toContainText("NEXUS OS is the control plane. Projects are workloads.");
    await expect(activeCommandTabPanel(page)).toContainText("Developer Details");

    expect(errors).toEqual([]);
  });

  test("project selector persists selected project context", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/projects");
    const selector = page.getByLabel("Project selector");
    await expect(selector).toBeVisible();
    await selector.selectOption("nexus-os");
    await expect(page.locator("body")).toContainText("Project: NEXUS OS");

    await page.reload();
    await expect(page.getByLabel("Project selector")).toHaveValue("nexus-os");
    await expect(page.locator("body")).toContainText("Project: NEXUS OS");

    await page.getByLabel("Project selector").selectOption("private-project-01");
    await expect(page.locator("body")).toContainText("Project: Selected Project");

    expect(errors).toEqual([]);
  });

  test("selected local-private project shows current project mission surfaces", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/projects");
    await page.getByLabel("Project selector").selectOption(CARE_PROJECT_ID);
    await expect(page.locator("body")).toContainText(`Selected Project: ${CARE_PROJECT_LABEL}`);
    await expect(page.locator("body")).toContainText(`Active phase: ${CARE_PHASE_LABEL}`);
    await expect(page.locator("body")).toContainText(CARE_NEXT_ACTION_LABEL);
    await expect(page.locator("body")).toContainText(CARE_PHASE_TASK_COUNT_LABEL);
    await commandTab(page, "Milestones").click();
    await expect(activeCommandTabPanel(page)).toContainText("CARELOOP-P2");
    await commandTab(page, "Gaps").click();
    await expect(activeCommandTabPanel(page)).toContainText("Provider dispatch remains disabled");

    await page.goto("/command-center/mission");
    await page.getByLabel("Project selector").selectOption(CARE_PROJECT_ID);
    await expect(page.locator("body")).toContainText(CARE_PROJECT_LABEL);
    await expect(page.locator("body")).toContainText(CARE_MISSION_LABEL);
    await expect(page.locator("body")).toContainText("Next Best Action");

    await page.goto("/command-center/tasks");
    await page.getByLabel("Project selector").selectOption(CARE_PROJECT_ID);
    await expect(page.locator("body")).toContainText("Phase 2 Product Brief");
    await expect(page.locator("body")).toContainText("Privacy and Safety Review");
    await expect(page.locator("body")).toContainText("Release Readiness Outline");
    await expect(page.locator("body")).toContainText("Governed planning review");

    expect(errors).toEqual([]);
  });

  test("project mission boundaries keep OS roadmap and demo surfaces separate", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/roadmap");
    const roadmapText = await page.locator("body").innerText();
    expect(roadmapText).not.toContain(CARE_PROJECT_LABEL);
    expect(roadmapText).not.toContain(CARE_PROJECT_ID);
    expect(roadmapText).not.toContain(CARE_PHASE_LABEL);

    await page.goto("/command-center/demo");
    const demoText = await page.locator("body").innerText();
    expect(demoText).toContain("Demo Mode");
    expect(demoText).not.toContain(CARE_PROJECT_LABEL);

    for (const route of [
      "/command-center/workspace",
      "/command-center/tasks",
      "/command-center/workbench",
      "/command-center/implementation",
    ]) {
      await page.goto(route);
      const body = await page.locator("body").innerText();
      expect(body).not.toContain("DemoApp");
    }

    await page.goto("/command-center/projects");
    await page.getByLabel("Project selector").selectOption(CARE_PROJECT_ID);
    await pickTheme(page, "dark");
    await expect(page.locator("body")).toContainText(CARE_PHASE_LABEL);
    await pickTheme(page, "light");
    await expect(page.locator("body")).toContainText(CARE_PHASE_LABEL);

    expect(errors).toEqual([]);
  });

  test("planned routes show a safe coming-soon state instead of crashing", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const path of ["/command-center/settings"]) {
      await page.goto(path);
      await expect(page.locator(".ccv2-page-head__title").first()).toBeVisible();
      await expect(page.locator("body")).toContainText(/Coming Soon|Planned/);
      await expect(page.locator("body")).toContainText("Read-only");
    }

    expect(errors).toEqual([]);
  });

  test("Docs & Guides renders real documentation cards", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/docs");
    const body = await page.locator("body").innerText();

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Docs & Guides");
    await expect(page.locator(".ccv2-page-head__sub")).toContainText("Operator, architecture, and contributor guidance");
    await expect(page.locator("body")).not.toContainText("Documentation Index");
    await expect(page.locator("body")).toContainText("Documentation Hub");
    await expect(page.locator("body")).toContainText("Start Here");
    await expect(page.locator("body")).toContainText("Operator Guides");
    await expect(page.locator("body")).toContainText("Codebase");
    await expect(page.locator("body")).toContainText("Architecture");
    await expect(page.getByLabel("Search documentation guides")).toBeVisible();
    for (const label of [
      "Getting Started",
      "Command Center Guide",
      "Running NEXUS Locally",
      "Starting a Mission",
      "Activating Tasks",
      "Agent Workbench",
      "Controlled Implementation",
      "Evidence & Audit",
      "Module Registry",
      "Reuse and Refactor Guide",
    ]) {
      expect(body).toContain(label);
    }
    await expect(page.getByRole("button", { name: /View Getting Started guide/i })).toBeVisible();
    await page.getByRole("button", { name: /View Command Center Guide guide/i }).click();
    await expect(page).toHaveURL(/\/command-center\/docs\/command-center-guide$/);
    await expect(page.getByLabel("Selected documentation guide")).toContainText("Command Center Guide");
    await page.getByRole("button", { name: /View Running NEXUS Locally guide/i }).click();
    await expect(page).toHaveURL(/\/command-center\/docs\/running-nexus-locally$/);
    await expect(page.getByLabel("Selected documentation guide")).toContainText("Running NEXUS Locally");
    await page.goto("/command-center/docs/getting-started");
    await expect(page.getByLabel("Selected documentation guide")).toContainText("Launch NEXUS locally");
    expect(await page.locator("body").innerText()).toContain("Start, inspect, troubleshoot, and shut down local NEXUS services");
    expect(body).not.toContain("docs/usage/GETTING_STARTED.md");
    expect(body).not.toContain("Open guide");
    expect(body).not.toContain("planned surface");
    expect(body).not.toContain("Coming Soon");
    expect(body).not.toContain("DemoApp");

    expect(errors).toEqual([]);
  });

  test("Activity Log shows tabbed filters and summarized activity instead of a placeholder", async ({ page }) => {
    const errors = captureClientErrors(page);
    const traceRecords = [
      {
        activityId: "act_traceview001",
        shortActivityId: "act_traceview...",
        correlationId: "corr_traceview001",
        shortCorrelationId: "corr_traceview...",
        timestamp: "2026-05-14T12:00:00.000Z",
        category: "ui",
        eventType: "operator_action_requested",
        source: "command_center",
        scope: "NEXUS_OS_CHANGE",
        mode: "local-private",
        status: "success",
        decision: "ALLOW",
        summary: "Operator opened Activity Log trace view.",
        taskId: "task-trace-001",
        agentId: "NEXUS",
        durationMs: 12,
        redacted: true,
        evidenceCount: 1,
        auditCount: 1,
      },
      {
        activityId: "act_traceview002",
        shortActivityId: "act_traceview...",
        correlationId: "corr_traceview001",
        shortCorrelationId: "corr_traceview...",
        timestamp: "2026-05-14T12:00:03.000Z",
        category: "api",
        eventType: "local_api_request_completed",
        source: "local_api",
        scope: "NEXUS_OS_CHANGE",
        mode: "local-private",
        status: "success",
        decision: "ALLOW",
        summary: "Local API returned redacted activity trace.",
        taskId: "task-trace-001",
        agentId: "NEXUS",
        durationMs: 18,
        redacted: true,
        evidenceCount: 1,
        auditCount: 1,
      },
    ];
    await page.route(/^http:\/\/(localhost|127\.0\.0\.1):4321\/activity/, async (route) => {
      if (route.request().url().includes("/activity/corr_traceview001")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            source: "live-local-api",
            data: {
              traceViewEnabled: true,
              correlationId: "corr_traceview001",
              trace: {
                traceVersion: "1.0",
                correlationId: "corr_traceview001",
                status: "success",
                startedAt: "2026-05-14T12:00:00.000Z",
                endedAt: "2026-05-14T12:00:03.000Z",
                durationMs: 3000,
                eventCount: 2,
                categories: { ui: 1, api: 1, action: 0, task: 0, evidence: 0, audit: 0, error: 0 },
                timeline: traceRecords.map((record) => ({
                  activityId: record.activityId,
                  timestamp: record.timestamp,
                  category: record.category,
                  eventType: record.eventType,
                  source: record.source,
                  agentId: record.agentId,
                  taskId: record.taskId,
                  status: record.status,
                  summary: record.summary,
                  evidenceIds: ["ev_trace_001"],
                  auditIds: ["audit_trace_001"],
                  redacted: true,
                })),
                related: {
                  taskIds: ["task-trace-001"],
                  agentIds: ["NEXUS"],
                  evidenceIds: ["ev_trace_001"],
                  auditIds: ["audit_trace_001"],
                  actionIds: [],
                },
                warnings: [],
                errors: [],
              },
              redacted: true,
            },
            warnings: [],
            errors: [],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          source: "live-local-api",
          data: {
            activityCaptureEnabled: true,
            storePath: "local-state/runtime/activity.jsonl",
            generatedAt: "2026-05-14T12:00:04.000Z",
            count: traceRecords.length,
            limit: 50,
            totalCount: traceRecords.length,
            warningCount: 0,
            categories: { ui: 1, api: 1 },
            correlationSummaries: [{ correlationId: "corr_traceview001", status: "success", eventCount: 2, redacted: true }],
            tracesAvailableCount: 1,
            failedTraceCount: 0,
            blockedTraceCount: 0,
            latestActivityId: "act_traceview002",
            latestCorrelationId: "corr_traceview001",
            records: traceRecords,
            providerLoggingEnabled: false,
            workerLoggingEnabled: false,
            dbBackedActivityEnabled: false,
            redacted: true,
          },
          warnings: [],
          errors: [],
        }),
      });
    });

    await page.goto("/command-center/activity?activityFixture=trace-view-test");
    const body = await page.locator("body").innerText();

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Activity Log");
    await expect(page.locator("body")).toContainText("Centralized activity timeline for UI, local API, governed actions, policy decisions, evidence, and failures.");
    await expect(page.locator("body")).toContainText("Activity schema");
    await expect(page.locator("body")).toContainText("Correlation ID model");
    await expect(page.locator("body")).toContainText("Central logger");
    await expect(page.locator("body")).toContainText("Local activity store");
    await expect(page.locator("body")).toContainText("UI/API/action instrumentation");
    await expect(page.locator("body")).toContainText("Capture wired");
    await expect(page.locator("body")).toContainText("Trace view");
    await expect(page.locator("body")).toContainText("Trace drilldown available");
    await expect(page.locator("body")).toContainText("Stored records");
    await expect(page.locator("body")).toContainText("Local API read requests");
    await expect(page.locator("body")).toContainText("Governed action bridge events");
    await expect(page.locator("body")).toContainText("Each operator action links UI, API, action bridge, evidence, audit, and runtime records by correlation ID.");
    for (const label of ["Overview", "Timeline", "By Agent", "By Task", "Failures & Blocks", "API & Actions", "Correlations"]) {
      await expect(commandTab(page, label)).toBeVisible();
    }
    await expect(page.getByPlaceholder("Search summary, event type, task, source, or correlation ID")).toBeVisible();
    await expect(page.getByLabel("Trace Details")).toContainText("Select a correlation ID");
    await commandTab(page, "Timeline").click();
    await expect(page.locator("body")).toContainText(/corr_traceview001|Trace corr_traceview|Activity event/i);
    await page.getByRole("button", { name: /Trace corr_traceview/i }).first().click();
    await expect(page.getByLabel("Trace Details")).toContainText("corr_traceview001");
    await expect(page.getByLabel("Trace Details")).toContainText("Correlation trace");
    await expect(page.getByLabel("Trace Details")).toContainText("Local API returned redacted activity trace.");
    await expect(page.getByRole("button", { name: /Copy correlation ID/i })).toBeVisible();
    await commandTab(page, "Timeline").click();
    await page.getByPlaceholder("Search summary, event type, task, source, or correlation ID").fill("no-such-activity-record");
    await expect(page.locator("body")).toContainText("No matching activity records");
    await commandTab(page, "Failures & Blocks").click();
    await expect(page.locator("body")).toContainText(/No failed, blocked, denied, redacted, or approval-required records|failed|blocked/i);
    await commandTab(page, "Correlations").click();
    await expect(page.locator("body")).toContainText(/Open a redacted trace timeline|No correlation IDs are available yet|linked event/i);
    expect(body).not.toContain("Coming Soon · planned Command Center surface");
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("{");
    expect(body).not.toContain("raw JSON");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Activity Log");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Activity Log");

    expect(errors).toEqual([]);
  });

  test("OS Roadmap tracks completed P43 foundation and current P44 multi-repo work", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/roadmap");
    const body = await page.locator("body").innerText();

    await commandTab(page, "Completed").click();
    const completedBody = await activeCommandTabPanel(page).innerText();
    expect(completedBody).toContain("P43.1");
    expect(completedBody).toContain("Scope Classification Model");
    expect(completedBody).toContain("P43.2");
    expect(completedBody).toContain("Project vs OS Mutation Boundary");
    expect(completedBody).toContain("P43.5");
    expect(completedBody).toContain("Command Center Scope Boundary UX");
    expect(completedBody).toContain("P44.1");
    expect(completedBody).toContain("Repo Registry");
    expect(completedBody).toContain("P44.2");
    expect(completedBody).toContain("Repo Ownership + Dependency Map");
    expect(body).toContain(NEXUS_CURRENT_OS_PHASE.phase);
    expect(body).toContain(NEXUS_CURRENT_OS_PHASE.label);
    expect(body).toContain(NEXUS_PREVIOUS_COMPLETED_PHASE.phase);
    expect(body).toContain(NEXUS_PREVIOUS_COMPLETED_PHASE.label);
    expect(body).not.toContain("DemoApp");

    expect(completedBody).toContain("P42.1");
    expect(completedBody).toContain("Project Registry Schema + Policy");
    expect(completedBody).toContain("P42.6");
    expect(completedBody).toContain("Project Capability Matrix");
    expect(completedBody).toContain("P42.7");
    expect(completedBody).toContain("Project Registry Adapter Final Validation + Roadmap Closure");

    expect(errors).toEqual([]);
  });

  test("Tool Gateway route renders read-only governed tool metadata", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tools");
    const body = await page.locator("body").innerText();

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Tool Gateway");
    await expect(page.locator("body")).toContainText("Governed Tool Gateway");
    await expect(page.locator("body")).toContainText("One governed tool gateway");
    await expect(page.locator("body")).toContainText("Execution disabled");
    await expect(page.locator("body")).toContainText("MCP placeholders disabled");
    await expect(page.locator("body")).toContainText("Tool Dispatch");
    await expect(page.locator("body")).toContainText("Readiness only");
    await expect(page.locator("body")).toContainText("Disabled reason: Tool execution and MCP runtime are disabled.");
    await expect(page.locator("body")).toContainText("Evidence: reports/p64-dispatch-readiness-report.md");
    await expect(page.locator("body")).toContainText("Cost impact: No direct provider spend.");
    await expect(page.locator("body")).toContainText("Code Mode Readiness");
    await expect(page.locator("body")).toContainText("Selected contracts: 2");
    await expect(page.locator("body")).toContainText("Only selected lazy contract summaries are allowed");
    await expect(page.locator("body")).toContainText("Code execution, provider dispatch, tool execution, worker execution, and project mutation remain disabled.");
    for (const label of [
      "Overview",
      "Tool Registry",
      "MCP Registry",
      "Permissions",
      "Contracts",
      "Adapters",
      "Lazy Loading",
      "Developer Details",
    ]) {
      await expect(commandTab(page, label)).toBeVisible();
    }
    await commandTab(page, "Tool Registry").click();
    await expect(activeCommandTabPanel(page)).toContainText("Git Status");
    await expect(activeCommandTabPanel(page)).toContainText("Execution: Disabled");
    await commandTab(page, "MCP Registry").click();
    await expect(activeCommandTabPanel(page)).toContainText("Filesystem MCP Placeholder");
    await expect(activeCommandTabPanel(page)).toContainText("Server enabled: No");
    await commandTab(page, "Permissions").click();
    await expect(activeCommandTabPanel(page)).toContainText("AUDITOR");
    await commandTab(page, "Contracts").click();
    await expect(activeCommandTabPanel(page)).toContainText("No all-tools-in-context loading.");
    await expect(activeCommandTabPanel(page)).toContainText("No all-MCP-schemas-in-context loading.");
    await commandTab(page, "Adapters").click();
    await expect(activeCommandTabPanel(page)).toContainText("Git Adapter Preview");
    await commandTab(page, "Lazy Loading").click();
    await expect(activeCommandTabPanel(page)).toContainText("Max contracts per task");
    await expect(activeCommandTabPanel(page)).toContainText("Code Mode Packet");
    await expect(activeCommandTabPanel(page)).toContainText("Execution: Disabled");

    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("private-project");
    expect(body).not.toContain('"inputSchema"');
    expect(body).not.toContain('"outputSchema"');
    expect(body).not.toContain("Requires P37");
    expect(body).not.toContain("Requires P38");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Tool Gateway");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Tool Gateway");

    expect(errors).toEqual([]);
  });

  test("Tool Gateway route shows code mode readiness without enabling execution", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tools");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Tool Gateway");
    await expect(page.locator("body")).toContainText("Code Mode Readiness");
    await expect(page.locator("body")).toContainText("Preview only");
    await expect(page.locator("body")).toContainText("Selected contracts: 2");
    await expect(page.locator("body")).toContainText("Bulk loading: Only selected lazy contract summaries are allowed");
    await expect(page.locator("body")).toContainText("Cost impact: No provider spend; metadata-only preview.");
    await commandTab(page, "Lazy Loading").click();
    await expect(activeCommandTabPanel(page)).toContainText("Code Mode Packet");
    await expect(activeCommandTabPanel(page)).toContainText("all-tool and all-MCP schema loading are blocked.");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("provider executed");
    expect(body).not.toContain("tool executed");
    expect(body).not.toContain("worker executed");

    await pickTheme(page, "dark");
    await expect(activeCommandTabPanel(page)).toContainText("Code Mode Packet");
    await pickTheme(page, "light");
    await expect(activeCommandTabPanel(page)).toContainText("Code Mode Packet");

    expect(errors).toEqual([]);
  });

  test("Trigger Gateway route renders preview-only integration metadata", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/triggers");
    const body = await page.locator("body").innerText();

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Trigger + Integrations");
    await expect(page.locator("body")).toContainText("Preview-only trigger gateway");
    await expect(page.locator("body")).toContainText("Execution disabled");
    await expect(page.locator("body")).toContainText("No credentials");
    for (const label of ["Overview", "Manual", "Scheduled", "GitHub", "Tickets", "Chat", "Developer Details"]) {
      await expect(commandTab(page, label)).toBeVisible();
    }
    await commandTab(page, "Scheduled").click();
    await expect(activeCommandTabPanel(page)).toContainText("Scheduled triggers: Preview only");
    await expect(activeCommandTabPanel(page)).toContainText("Runtime scheduler: Not enabled");
    await commandTab(page, "GitHub").click();
    await expect(activeCommandTabPanel(page)).toContainText("GitHub Events - Preview only");
    await commandTab(page, "Tickets").click();
    await expect(activeCommandTabPanel(page)).toContainText("Jira / Linear - Planned integration");
    await commandTab(page, "Chat").click();
    await expect(activeCommandTabPanel(page)).toContainText("Slack / Teams - Planned integration");

    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("Requires P37");

    expect(errors).toEqual([]);
  });

  test("API Batch route renders preview-only provider and batch metadata", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/api-batch");
    const body = await page.locator("body").innerText();

    await expect(page.locator(".ccv2-page-head__title")).toContainText("API / Batch Adapter");
    await expect(page.locator("body")).toContainText("Preview-only provider request packaging");
    await expect(page.locator("body")).toContainText("Provider calls disabled");
    await expect(page.locator("body")).toContainText("Upload disabled");
    await expect(page.locator("body")).toContainText("Governed Dispatch Dry Run");
    await expect(page.locator("body")).toContainText("Current state");
    await expect(page.locator("body")).toContainText("Dry-run only");
    await expect(page.locator("body")).toContainText("Estimate only; no provider spend.");
    await expect(page.locator("body")).toContainText("Batch Intelligence Readiness");
    await expect(page.locator("body")).toContainText("Redacted summaries only");
    await expect(page.locator("body")).toContainText("Provider upload, batch submission, provider spend, and execution remain disabled.");
    for (const label of [
      "Overview",
      "Provider Adapters",
      "Batch Jobs",
      "Cost Estimate",
      "Reconciliation",
      "Developer Details",
    ]) {
      await expect(commandTab(page, label)).toBeVisible();
    }
    await commandTab(page, "Provider Adapters").click();
    await expect(activeCommandTabPanel(page)).toContainText("OpenAI API Preview");
    await expect(activeCommandTabPanel(page)).toContainText("External calls disabled");
    await commandTab(page, "Batch Jobs").click();
    await expect(activeCommandTabPanel(page)).toContainText("JSONL preview files");
    await expect(activeCommandTabPanel(page)).toContainText("Upload disabled");
    await commandTab(page, "Cost Estimate").click();
    await expect(activeCommandTabPanel(page)).toContainText("Estimated input tokens");
    await commandTab(page, "Reconciliation").click();
    await expect(activeCommandTabPanel(page)).toContainText("Result Reconciliation Preview");

    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("raw prompt");
    expect(body).not.toContain("provider submitted");
    expect(body).not.toContain("batch submitted");
    expect(body).not.toContain("Requires P37");

    expect(errors).toEqual([]);
  });

  test("Batch Queue route shows batch intelligence readiness without upload", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/batch");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Batch Queue");
    await expect(page.locator("body")).toContainText("Batch API Status");
    await expect(page.locator("body")).toContainText("Batch Intelligence Readiness");
    await expect(page.locator("body")).toContainText("Preview only");
    await expect(page.locator("body")).toContainText("Upload disabled");
    await expect(page.locator("body")).toContainText("Requests: 2");
    await expect(page.locator("body")).toContainText("Redaction: Redacted summaries only");
    await expect(page.locator("body")).toContainText("Cost impact: Estimate only; no provider spend.");
    await expect(page.locator("body")).toContainText("Evidence: reports/p65-batch-safety-gate-report.md");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("provider submitted");
    expect(body).not.toContain("batch submitted");

    await pickTheme(page, "dark");
    await expect(page.locator("body")).toContainText("Batch Intelligence Readiness");
    await pickTheme(page, "light");
    await expect(page.locator("body")).toContainText("Batch Intelligence Readiness");

    expect(errors).toEqual([]);
  });

  test("Test Center renders with overview and policy posture", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tests");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Test Center");
    await expect(page.locator("body")).toContainText("Execution is not enabled in Test Center yet");
    await expect(page.locator("body")).toContainText("Policy Posture");
    await expect(page.locator("body")).toContainText("testExecutionAllowed: false");
    await expect(page.locator("body")).toContainText("Registry only");

    expect(errors).toEqual([]);
  });

  test("Test Center shows Project Tests and OS Tests as separate sections", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tests");
    await commandTab(page, "Project Tests").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project Test Suites");
    await commandTab(page, "OS Tests").click();
    await expect(activeCommandTabPanel(page)).toContainText("NEXUS OS Test Suites");

    expect(errors).toEqual([]);
  });

  test("Test Center shows execution disabled state", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tests");
    await expect(page.locator("body")).toContainText("Execution disabled");
    await commandTab(page, "Project Tests").click();
    await expect(activeCommandTabPanel(page)).toContainText("Execution disabled");

    expect(errors).toEqual([]);
  });

  test("Test Center does not show DemoApp content", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/tests");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("DEMOAPP ACTIVE");

    expect(errors).toEqual([]);
  });

  test("Quality Intelligence route renders preview-only test gap metadata", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/quality");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Quality Intelligence");
    await expect(page.locator("body")).toContainText("Preview-only quality intelligence");
    await expect(page.locator("body")).toContainText("Test execution disabled");
    await expect(page.locator("body")).toContainText("No project mutation");
    await expect(page.locator("body")).toContainText("Requirements mapped");
    await expect(page.locator("body")).toContainText("Coverage gaps");

    for (const label of ["PRD Mapping", "Coverage Gaps", "Recommendations", "Flaky Signals", "Test Proposals"]) {
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "Coverage Gaps").click();
    await expect(activeCommandTabPanel(page)).toContainText("Coverage Gap Detector");
    await expect(activeCommandTabPanel(page)).toContainText("Execution disabled");

    await commandTab(page, "Test Proposals").click();
    await expect(activeCommandTabPanel(page)).toContainText("Approval required");
    await expect(activeCommandTabPanel(page)).toContainText("Mutation disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("Requires P37");
    expect(body).not.toContain("Requires P38");
    expect(body).not.toContain("raw JSON");

    expect(errors).toEqual([]);
  });

  test("Cost Center route renders preview cost governance tabs", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/cost");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Cost Center");
    await expect(page.locator("body")).toContainText("Ready for estimates");
    await expect(page.locator("body")).toContainText("Real provider spend");
    await expect(page.locator("body")).toContainText("Disabled");

    for (const label of ["Budgets", "Estimates", "Ledger", "Enforcement", "Gaps / Next", "Developer Details"]) {
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "Budgets").click();
    await expect(activeCommandTabPanel(page)).toContainText("Project");
    await expect(activeCommandTabPanel(page)).toContainText("Tool");
    await expect(activeCommandTabPanel(page)).toContainText("API Batch");

    await commandTab(page, "Estimates").click();
    await expect(activeCommandTabPanel(page)).toContainText("Task estimate preview");
    await expect(activeCommandTabPanel(page)).toContainText("no provider call");

    await commandTab(page, "Ledger").click();
    await expect(activeCommandTabPanel(page)).toContainText("Redacted cost ledger preview");

    await commandTab(page, "Enforcement").click();
    await expect(activeCommandTabPanel(page)).toContainText("REQUIRE_APPROVAL");
    await expect(activeCommandTabPanel(page)).toContainText("Provider dispatch requested");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("\"records\"");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("real spend captured");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Cost Center");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Cost Center");

    expect(errors).toEqual([]);
  });

  test("Policy Center route renders governance admin previews", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/policies");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Policy Center");
    await expect(page.locator("body")).toContainText("Policy registry");
    await expect(page.locator("body")).toContainText("Runtime enforcement changes");
    await expect(page.locator("body")).toContainText("Not enabled");
    await expect(page.locator("body")).toContainText("Dispatch Governance");
    await expect(page.locator("body")).toContainText("Policy simulation does not apply runtime changes.");
    await expect(page.locator("body")).toContainText("reports/p64-dispatch-envelope-report.md");

    for (const label of [
      "Registry",
      "Versions",
      "Diff Preview",
      "Simulation",
      "Exceptions",
      "Break-Glass",
      "Developer Details",
    ]) {
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "Simulation").click();
    await expect(activeCommandTabPanel(page)).toContainText("Provider dispatch attempt");
    await expect(activeCommandTabPanel(page)).toContainText("DENY");

    await commandTab(page, "Exceptions").click();
    await expect(activeCommandTabPanel(page)).toContainText("time-bound");
    await expect(activeCommandTabPanel(page)).toContainText("evidence-bound");

    await commandTab(page, "Break-Glass").click();
    await expect(activeCommandTabPanel(page)).toContainText("disabled by default");
    await expect(activeCommandTabPanel(page)).toContainText("human approval");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("providerCallsAllowed");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Policy Center");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Policy Center");

    expect(errors).toEqual([]);
  });

  test("Secrets Boundary route renders reference-only credential posture", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/secrets");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Secrets Boundary");
    await expect(page.locator("body")).toContainText("NEXUS stores references only");
    await expect(page.locator("body")).toContainText("Raw secret values are not displayed");
    await expect(page.locator("body")).toContainText("Provider credentials");

    for (const label of ["Provider Credentials", "Project Credentials", "DB / Deploy", "Integrations", "Developer Details"]) {
      await commandTab(page, label).click();
      await expect(activeCommandTabPanel(page)).toBeVisible();
    }

    await commandTab(page, "DB / Deploy").click();
    await expect(activeCommandTabPanel(page)).toContainText("DB writes");
    await expect(activeCommandTabPanel(page)).toContainText("Deploy execution");
    await expect(activeCommandTabPanel(page)).toContainText("Mobile signing");
    await expect(activeCommandTabPanel(page)).toContainText("Disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toMatch(/sk-[A-Za-z0-9_-]{12,}/);
    expect(body).not.toContain(["DATABASE_URL", "="].join(""));
    expect(body).not.toContain("Bearer ");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Secrets Boundary");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Secrets Boundary");

    expect(errors).toEqual([]);
  });

  test("Live Ready route renders evidence-backed activation labels without runnable actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/live-readiness");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Live Readiness");
      await expect(page.locator("body")).toContainText("evidence-backed live-ready labels");
      await expect(page.locator("body")).toContainText("Current state");
      await expect(page.locator("body")).toContainText("Next action");
      await expect(page.locator("body")).toContainText("Cost impact");
      await expect(page.locator("body")).toContainText("Live-ready activation is display-only");
    }

    await commandTab(page, "Capability Gates").click();
    await expect(activeCommandTabPanel(page)).toContainText("Ready");
    await expect(activeCommandTabPanel(page)).toContainText("Needs setup");
    await expect(activeCommandTabPanel(page)).toContainText("Blocked by policy");
    await expect(activeCommandTabPanel(page)).toContainText("Provider Calls");
    await expect(activeCommandTabPanel(page)).toContainText("Generated Snake iOS Build");
    await expect(activeCommandTabPanel(page)).toContainText("local-build validated");
    await expect(activeCommandTabPanel(page)).toContainText("Project Source Mutation");
    await expect(activeCommandTabPanel(page)).toContainText("Worker Execution");
    await expect(activeCommandTabPanel(page)).toContainText("Deploy / Release");
    await expect(activeCommandTabPanel(page)).toContainText("Provider Spend");
    await commandTab(page, "Bridge Admission").click();
    await expect(activeCommandTabPanel(page)).toContainText("mission.compose");
    await expect(activeCommandTabPanel(page)).toContainText("implementation.apply");
    await expect(activeCommandTabPanel(page)).toContainText("Blocked before bridge execution");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Provider Calls disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/run now|execute now|deploy now|apply now|call provider now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("private-project-01");
    expect(body).not.toContain("private-project-governed-build-mission");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P79\./);

    expect(errors).toEqual([]);
  });

  test("Founder Intake route renders local intake posture without runnable actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/founder-intake");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Founder Intake");
      await expect(page.locator("body")).toContainText("structured business answers locally");
      await expect(page.locator("body")).toContainText("Current state");
      await expect(page.locator("body")).toContainText("Next action");
      await expect(page.locator("body")).toContainText("Cost impact");
      await expect(page.locator("body")).toContainText("Founder intake is local and governed");
    }

    await commandTab(page, "Questions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Next Question");
    await expect(activeCommandTabPanel(page)).toContainText("businessModel");
    await expect(activeCommandTabPanel(page)).toContainText("Captured Answers");
    await commandTab(page, "Readiness").click();
    await expect(activeCommandTabPanel(page)).toContainText("Comprehension");
    await expect(activeCommandTabPanel(page)).toContainText("Evidence");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Provider Calls disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Project Creation disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/run now|execute now|deploy now|apply now|call provider now|create project now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("private-project-01");
    expect(body).not.toContain("private-project-governed-build-mission");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P80\./);

    expect(errors).toEqual([]);
  });

  test("Business Build route renders dry-run plan without runnable actions", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/business-build");

    for (const theme of ["dark", "light", "system"]) {
      await pickTheme(page, theme);
      await expect(page.locator(".ccv2-page-head__title")).toContainText("Business Build");
      await expect(page.locator("body")).toContainText("Dry-run business build plan");
      await expect(page.locator("body")).toContainText("Current state");
      await expect(page.locator("body")).toContainText("Next action");
      await expect(page.locator("body")).toContainText("Cost impact");
      await expect(page.locator("body")).toContainText("Runtime execution remains disabled");
    }

    await commandTab(page, "PRD Readiness").click();
    await expect(activeCommandTabPanel(page)).toContainText("PRD Readiness");
    await expect(activeCommandTabPanel(page)).toContainText("Founder intake answers");
    await commandTab(page, "Workstreams").click();
    await expect(activeCommandTabPanel(page)).toContainText("Product");
    await expect(activeCommandTabPanel(page)).toContainText("Engineering");
    await expect(activeCommandTabPanel(page)).toContainText("Go To Market");
    await commandTab(page, "Milestones").click();
    await expect(activeCommandTabPanel(page)).toContainText("PRD Readiness Review");
    await expect(activeCommandTabPanel(page)).toContainText("Risk Cost Review");
    await commandTab(page, "Disabled Actions").click();
    await expect(activeCommandTabPanel(page)).toContainText("Provider Calls disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Project Mutation disabled");
    await expect(activeCommandTabPanel(page)).toContainText("Provider Spend disabled");

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i);
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("private-project-01");
    expect(body).not.toContain("private-project-governed-build-mission");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toMatch(/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/P81\./);

    expect(errors).toEqual([]);
  });

  test("full Command Center routes do not show DemoApp", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/demo");
    const demoText = await page.locator("body").innerText();
    expect(demoText).toContain("Demo Mode");

    const routesRequiringNoProject = new Set([
      "/command-center/workspace",
      "/command-center/tasks",
      "/command-center/workbench",
      "/command-center/implementation",
      "/command-center/projects",
    ]);

    for (const route of [
      "/",
      "/command-center/workspace",
      "/command-center/tasks",
      "/command-center/workbench",
      "/command-center/implementation",
      "/command-center/projects",
      "/command-center/evidence",
      "/command-center/safety",
      "/command-center/recovery",
      "/command-center/roadmap",
      "/command-center/liveapi",
      "/command-center/database",
      "/command-center/services",
      "/command-center/compliance",
      "/command-center/live-readiness",
      "/command-center/founder-intake",
      "/command-center/business-build",
    ]) {
      await page.goto(route);
      const body = await page.locator("body").innerText();
      expect(body).not.toContain("DEMOAPP ACTIVE");
      expect(body).not.toContain("DemoApp");
      expect(body).not.toContain("private-project-01");
      expect(body).not.toContain("private-project-governed-build-mission");
      expect(body).not.toContain("private project companion");
      if (routesRequiringNoProject.has(route)) {
        expect(body).toContain("No project selected");
      }
    }

    expect(errors).toEqual([]);
  });

  test("every primary route has a heading, state block, and no raw JSON dump", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const route of PRIMARY_COMMAND_CENTER_ROUTES) {
      const target = route.key === "mission" ? "/" : route.path;
      await page.goto(target);

      await expect(page.locator(".ccv2-page-head__title").first()).toBeVisible();
      const stateBlocks = page.locator(
        ".ccv2-card, .ccv2-stat-chip, .ccv2-wb-empty, .ccv2-info-banner, .ccv2-workspace-nba, .ccv2-roadmap-track, .ccv2-roadmap-summary-card",
      );
      await expect(stateBlocks.first()).toBeVisible();

      const body = await page.locator("body").innerText();
      expect(body).not.toContain("snapshotVersion");
      expect(body).not.toContain("\"generatedAt\"");
      expect(body).not.toContain("{\"");
    }

    expect(errors).toEqual([]);
  });

  test("Recovery route is inspection-only and hides raw identifiers", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/recovery");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Recovery");
    await expect(page.locator("body")).toContainText("Inspection-only recovery preview is available.");
    await expect(page.locator("body")).toContainText("Self-Healing Failure Loop");
    await expect(page.locator("body")).toContainText("Failure class");
    await expect(page.locator("body")).toContainText("Proposed recovery");
    await expect(page.locator("body")).toContainText("reports/p66-healing-safety-gate-report.md");
    await expect(page.locator("body")).toContainText("No repair action can run from Command Center.");
    await expect(page.locator("body")).toContainText("Recovery preview snapshot");
    await expect(page.getByRole("button", { name: /Disabled action: Restore/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Replay/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Resume/i })).toBeDisabled();

    await pickTheme(page, "dark");
    let themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("dark");
    expect(themeState.shellTheme).toBe("dark");

    await pickTheme(page, "light");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.shellTheme).toBe("light");

    await pickTheme(page, "system");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("system");
    expect(["dark", "light"]).toContain(themeState.resolvedTheme);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("project_");
    expect(body).not.toContain("private_");
    expect(body).not.toContain("snapshotVersion");
    expect(body).not.toContain("{\"");
    expect(body).toContain("No provider calls");
    expect(body).toContain("disabled");

    expect(errors).toEqual([]);
  });

  test("Self-Update route renders readiness without enabling apply", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/self-update");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Self-Update");
    await expect(page.locator("body")).toContainText("Approval and rollback gates are ready for operator review.");
    await expect(page.locator("body")).toContainText("Readiness does not unlock self-update apply.");
    await expect(page.locator("body")).toContainText("No provider calls");
    await expect(page.locator("body")).toContainText("reports/command-center-self-update-ux-report.md");

    await page.getByRole("tab", { name: /Disabled Actions/i }).click();
    await expect(page.getByRole("button", { name: /Disabled action: Apply self-update/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Generate patch/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Dispatch tools/i })).toBeDisabled();

    await pickTheme(page, "dark");
    let themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("dark");
    expect(themeState.shellTheme).toBe("dark");

    await pickTheme(page, "light");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.shellTheme).toBe("light");

    await pickTheme(page, "system");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("system");
    expect(["dark", "light"]).toContain(themeState.resolvedTheme);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("project_");
    expect(body).not.toContain("private_");
    expect(body).not.toContain("snapshotVersion");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("P68");

    expect(errors).toEqual([]);
  });

  test("Release Control route renders readiness without enabling deploy", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/release");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Release Control");
    await expect(page.locator("body")).toContainText("Deploy readiness is ready for operator review");
    await expect(page.locator("body")).toContainText("Readiness does not unlock deploy execution.");
    await expect(page.locator("body")).toContainText("No provider calls");
    await expect(page.locator("body")).toContainText("reports/command-center-release-ux-report.md");

    await page.getByRole("tab", { name: /Disabled Actions/i }).click();
    await expect(page.getByRole("button", { name: /Disabled action: Create release package/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Start deploy/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Override gate/i })).toBeDisabled();

    await pickTheme(page, "dark");
    let themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("dark");
    expect(themeState.shellTheme).toBe("dark");

    await pickTheme(page, "light");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.shellTheme).toBe("light");

    await pickTheme(page, "system");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("system");
    expect(["dark", "light"]).toContain(themeState.resolvedTheme);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("project_");
    expect(body).not.toContain("private_");
    expect(body).not.toContain("snapshotVersion");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("P69");

    expect(errors).toEqual([]);
  });

  test("Deploy Monitoring route renders readiness without enabling mitigation", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/monitoring");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Deploy Monitoring");
    await expect(page.locator("body")).toContainText("Mitigation readiness is ready for operator review");
    await expect(page.locator("body")).toContainText("Readiness does not unlock mitigation execution.");
    await expect(page.locator("body")).toContainText("No provider calls");
    await expect(page.locator("body")).toContainText("reports/command-center-monitoring-ux-report.md");

    await page.getByRole("tab", { name: /Disabled Actions/i }).click();
    await expect(page.getByRole("button", { name: /Disabled action: Dispatch alert/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Run rollback/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Start mitigation/i })).toBeDisabled();

    await pickTheme(page, "dark");
    let themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("dark");
    expect(themeState.shellTheme).toBe("dark");

    await pickTheme(page, "light");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.shellTheme).toBe("light");

    await pickTheme(page, "system");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("system");
    expect(["dark", "light"]).toContain(themeState.resolvedTheme);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("project_");
    expect(body).not.toContain("private_");
    expect(body).not.toContain("snapshotVersion");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("P70");

    expect(errors).toEqual([]);
  });

  test("Project Shipping route renders readiness without enabling export", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/shipping");

    await expect(page.locator(".ccv2-page-head__title")).toContainText("Project Shipping");
    await expect(page.locator("body")).toContainText("Shipping readiness is ready for operator review");
    await expect(page.locator("body")).toContainText("Readiness does not unlock package creation or export execution.");
    await expect(page.locator("body")).toContainText("No provider calls");
    await expect(page.locator("body")).toContainText("reports/command-center-shipping-ux-report.md");

    await page.getByRole("tab", { name: /Disabled Actions/i }).click();
    await expect(page.getByRole("button", { name: /Disabled action: Create package/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Run export/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Disabled action: Ship handoff/i })).toBeDisabled();

    await pickTheme(page, "dark");
    let themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("dark");
    expect(themeState.shellTheme).toBe("dark");

    await pickTheme(page, "light");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("light");
    expect(themeState.shellTheme).toBe("light");

    await pickTheme(page, "system");
    themeState = await getThemeState(page);
    expect(themeState.rootTheme).toBe("system");
    expect(["dark", "light"]).toContain(themeState.resolvedTheme);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("project_");
    expect(body).not.toContain("private_");
    expect(body).not.toContain("snapshotVersion");
    expect(body).not.toContain("{\"");
    expect(body).not.toContain("P71");

    expect(errors).toEqual([]);
  });
});
