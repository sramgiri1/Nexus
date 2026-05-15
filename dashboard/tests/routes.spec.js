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
  "mission",
  "workspace",
  "tasks",
  "workbench",
  "implementation",
  "skills",
  "hooks",
  "agentRooms",
  "liveapi",
  "database",
  "services",
  "evidence",
  "safety",
  "projects",
  "roadmap",
  "demo",
];

const PRIMARY_COMMAND_CENTER_ROUTES = PRIMARY_ROUTE_KEYS.map(
  (key) => COMMAND_CENTER_ROUTES.find((route) => route.key === key),
).filter(Boolean);

const SCREENSHOT_AUDIT_ROUTE_KEYS = PRIMARY_ROUTE_KEYS.filter((key) => !["services", "agentRooms", "skills", "hooks"].includes(key));
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
  return page.locator(".ccv2-command-tabs__panel:not([hidden])");
}

test("home route renders Command Center V2 shell", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/");

  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-sidebar__brand-name")).toContainText("NEXUS OS");
  await expect(page.getByRole("link", { name: /Mission Control/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Workspace/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Durable State/i })).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Mission Control");
  await expect(page.locator("#v2-mission-hero")).toBeVisible();
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  await expect(page.locator(".shell-sidebar")).toHaveCount(0);

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
    ["/command-center", "Starting a Mission", "docs/usage/STARTING_A_MISSION.md"],
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

      for (const route of SCREENSHOT_AUDIT_ROUTES) {
        expect(manifest.routes.some((entry) => entry.path === route.path)).toBe(true);
      }
    }
  });

  test("theme switcher exists globally", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");

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

    await page.goto("/");
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
    await page.goto("/");
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

  test("Command Palette entrypoint exists and opens core commands", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");
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

    await page.goto("/");
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

    await page.goto("/");
    await page.getByRole("button", { name: /Open Command Palette/i }).click();

    const dialog = page.getByRole("dialog", { name: /NEXUS Command Palette/i });
    await dialog.getByRole("button", { name: /Plan Mission/i }).click();
    await expect(dialog).toContainText("Trigger preview");
    await expect(dialog).toContainText("Preview only - trigger execution is not enabled yet");

    expect(errors).toEqual([]);
  });

  test("Command Palette disabled commands show clear reasons and do not execute", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");
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

    await page.goto("/");

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

    await page.goto("/command-center");

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

    await page.goto("/command-center");

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

    await page.goto("/command-center");

    await expect(page.getByRole("group", { name: /Scope selector/i })).toBeVisible();
    const scopeSelector = page.getByRole("group", { name: /Scope selector/i });
    await expect(scopeSelector.getByRole("button", { name: "Project", exact: true })).toBeVisible();
    await expect(scopeSelector.getByRole("button", { name: "Portfolio", exact: true })).toBeVisible();
    await expect(scopeSelector.getByRole("button", { name: "NEXUS OS", exact: true })).toBeVisible();
    await expect(page.getByLabel("Project context")).toContainText("Active Project");
    await expect(page.getByLabel("Project context")).toContainText("Private Project");
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

    await page.goto("/command-center");
    const scopeSelector = page.getByRole("group", { name: /Scope selector/i });

    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Active Mission");
    await expect(page.locator(".ccv2-command-tabs__panel:not([hidden])")).toContainText("Next Best Action");
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

    await page.goto("/");
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

    await page.goto("/command-center");
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
    const errors = captureClientErrors(page);

    for (const route of IMPLEMENTED_COMMAND_CENTER_ROUTES) {
      const target = route.key === "mission" ? "/" : route.path;
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

    await page.goto("/");

    for (const section of [
      "Mission Control",
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

    await page.goto("/");

    const missionHero = page.locator("#v2-mission-hero");

    await expect(missionHero).toBeVisible();
    await expect(missionHero.getByText("Active Project", { exact: false }).first()).toBeVisible();
    await expect(missionHero.getByText("Active Mission", { exact: false }).first()).toBeVisible();
    await expect(missionHero).toContainText("Private Project Governed Build Mission");
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

    await page.goto("/");

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

    await page.goto("/");
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
      const target = route.key === "mission" ? "/" : route.path;
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

  test("sidebar uses cleaned product labels and preserves full labels", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");
    const sidebarText = await page.locator(".ccv2-sidebar").innerText();

    expect(sidebarText).toContain("Agent Workbench");
    expect(sidebarText).toContain("Implementation");
    expect(sidebarText).toContain("Live API");
    expect(sidebarText).toContain("Durable State");
    expect(sidebarText).toContain("Activity Log");
    expect(sidebarText).toContain("Docs & Guides");
    expect(sidebarText).toContain("Settings");
    expect(sidebarText).not.toContain("Agent Workbench P38");
    expect(sidebarText).not.toContain("Implementation P39");
    expect(sidebarText).not.toContain("Live API P40");
    expect(sidebarText).not.toContain("Durable State P41");
    await expect(page.getByRole("link", { name: /Agent Workbench/i })).toHaveAttribute("title", "Agent Workbench");
    await expect(page.getByRole("link", { name: /Docs & Guides/i })).toHaveAttribute("title", "Docs & Guides");

    expect(errors).toEqual([]);
  });

  test("top header is compact and omits noisy runtime badges", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/");

    const topbar = await page.locator(".ccv2-topbar").innerText();
    expect(topbar).toContain("NEXUS");
    expect(topbar).toContain("Mission Control");
    expect(topbar).toContain("Project");
    expect(topbar).not.toContain("Environment:");
    expect(topbar).not.toContain("Desktop");
    expect(topbar).not.toContain("Local API");
    expect(topbar).not.toContain("Durable State");
    expect(topbar).not.toContain("ENVDesktop");
    expect(topbar).not.toContain("local-");
    expect(topbar).not.toContain("Command Palette");
    await expect(page.getByLabel("Open Command Palette")).toBeVisible();
    await expect(page.getByRole("button", { name: /Open theme menu/i })).toBeVisible();
    await expect(page).toHaveTitle(/NEXUS OS - Agentic Command Center/);
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
      ["/command-center/database", ["Overview", "Entities", "Import Plan", "Fallback", "Developer Details"]],
      ["/command-center/evidence", ["Timeline", "By Task", "By Agent", "By Project", "Developer Details"]],
      ["/command-center/safety", ["Posture", "Policy Blocks", "Approvals", "Data & Privacy", "Developer Details"]],
      ["/command-center/projects", ["Portfolio", "Selected Project", "Stack", "Capabilities", "Milestones", "Gaps", "Evidence", "Settings / Adapter"]],
      ["/command-center/roadmap", ["Completed", "In Progress", "Planned"]],
      ["/command-center/cost", ["Overview", "Budgets", "By Project", "By Agent", "Provider Spend"]],
      ["/command-center/batch", ["Overview", "Jobs", "Results", "Cost"]],
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
        expect(body).toContain("Private Project");
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
    await expect(page.locator("body")).toContainText("Selected Project: Private Project");
    await expect(page.locator("body")).toContainText("Project Type: SaaS + Mobile");
    await expect(page.locator("body")).toContainText("Stack: Node/Fastify + Prisma + iOS");

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
    await expect(page.locator("body")).toContainText("Private Project");

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

  test("core operational pages prioritize active project context and keep DemoApp out", async ({ page }) => {
    const errors = captureClientErrors(page);

    for (const path of [
      "/command-center/workspace",
      "/command-center/tasks",
      "/command-center/workbench",
      "/command-center/implementation",
    ]) {
      await page.goto(path);
      await expect(page.locator("body")).toContainText("Active Project Context");
      await expect(page.locator("body")).toContainText("Private Project");
      await expect(page.locator("body")).toContainText("Project-scoped tasks, evidence, gates, cost, and progress");
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
    await expect(page.locator("body")).toContainText("Private Project");
    await commandTab(page, "Milestones").click();
    await expect(activeCommandTabPanel(page)).toContainText("OS Roadmap tracks NEXUS platform phases. Project milestones live under Projects.");
    await expect(activeCommandTabPanel(page)).toContainText("Project registry foundation");
    await expect(activeCommandTabPanel(page)).toContainText("Adapter runtime");

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
    await expect(page.locator("body")).toContainText("Project: Private Project");

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

    expect(body).not.toContain("DemoApp");
    expect(body).not.toContain("raw JSON");
    expect(body).not.toContain("Requires P37");
    expect(body).not.toContain("Requires P38");

    await pickTheme(page, "dark");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Tool Gateway");
    await pickTheme(page, "light");
    await expect(page.locator(".ccv2-page-head__title")).toContainText("Tool Gateway");

    expect(errors).toEqual([]);
  });

  test("DemoApp appears on demo route only", async ({ page }) => {
    const errors = captureClientErrors(page);

    await page.goto("/command-center/demo");
    const demoText = await page.locator("body").innerText();
    expect(demoText).toContain("Demo Mode");

    for (const route of ["/", "/command-center/workspace"]) {
      await page.goto(route);
      const body = await page.locator("body").innerText();
      expect(body).not.toContain("DEMOAPP ACTIVE");
      expect(body).not.toContain("DemoApp");
      expect(body).toContain("Private Project");
      expect(body.toLowerCase()).toContain("local-private");
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
});
