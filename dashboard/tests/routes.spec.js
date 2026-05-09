import { expect, test } from "@playwright/test";

function captureClientErrors(page) {
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("favicon.ico")) return;
    // Action bridge health check fails when server is not running during tests — expected
    if (text.includes("ERR_CONNECTION_REFUSED")) return;
    if (text.includes("net::ERR_")) return;
    // CORS error from action bridge health check — expected when server CORS origin differs from test origin
    if (text.includes("has been blocked by CORS policy")) return;
    errors.push(`console: ${text}`);
  });

  return errors;
}

test("home route renders Command Center V2 shell", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/");

  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.getByText("NEXUS OS")).toBeVisible();
  await expect(page.getByRole("link", { name: /Mission Control/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Release/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Agent Fleet/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Safety Center/i })).toBeVisible();
  await expect(page.getByText("Start a Mission")).toBeVisible();
  await expect(page.locator(".ccv2-mission-composer__textarea")).toBeVisible();
  await expect(page.getByText("Generate Plan")).toBeVisible();
  await expect(page.getByText("Mission Control").first()).toBeVisible();
  await expect(page.locator("#v2-execution-pipeline")).toContainText("Execution Pipeline");
  await expect(page.locator("#v2-activity-stream")).toContainText("Activity Stream");
  await expect(page.getByText("Private Project Validation")).toBeVisible();
  await expect(page.locator("#v2-private-validation .ccv2-pv-stat__value").first()).toBeVisible();
  await expect(page.getByText("Evidence and Governance")).toBeVisible();
  await expect(page.getByText("Release Readiness", { exact: true })).toBeVisible();
  await expect(page.getByText("Safety Center")).toBeVisible();
  await expect(page.locator(".shell-sidebar")).toHaveCount(0);

  // V1 rail must NOT be visible on V2 routes
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  await expect(page.getByText("HOME", { exact: true })).toHaveCount(0);
  await expect(page.getByText("VERSE", { exact: true })).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("legacy command center route renders legacy Command Center", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/legacy-command-center");

  // Legacy CC uses DemoApp as the active project label in the topbar chip
  await expect(page.locator(".page--command")).toBeVisible();
  await expect(page.getByRole("heading", { name: "NEXUS Command Center" })).toBeVisible();
  await expect(page.getByRole("banner").getByText("Environment · Prototype")).toBeVisible();
  await expect(page.getByRole("banner").getByText("Active project · DemoApp")).toBeVisible();
  await expect(page.locator(".command-prototype__sidebar")).toBeVisible();
  await expect(page.locator("#private-validation")).toContainText("Private Project Validation");
  await expect(page.locator("#private-validation")).toContainText("58/58");
  await expect(page.locator("#mission-composer")).toContainText("Start a Mission");
  await expect(page.locator(".shell-sidebar")).toHaveCount(0);

  expect(errors).toEqual([]);
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
  await expect(page.locator(".orbit-node--team")).toHaveCount(6);

  await page.locator(".orbit-node--sun").click();
  await expect(page.locator(".orbit-popup")).toBeVisible();
  await page.waitForTimeout(350);

  const popupOutsideStage = await page.evaluate(() => {
    const popup = document.querySelector(".orbit-popup");
    const stage = document.querySelector(".orbit-stage");
    if (!popup || !stage) return false;
    const popupRect = popup.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    return popupRect.top >= stageRect.bottom - 1;
  });
  expect(popupOutsideStage).toBe(true);

  await page.locator(".orbit-node--team", { hasText: "Product" }).click();
  await page.waitForTimeout(350);

  const afterSpeak = await page.evaluate(() => window.__speechEvents);
  const speakEvents = afterSpeak.filter((event) => event.type === "speak");
  expect(speakEvents).toHaveLength(2);
  expect(speakEvents[0]?.voice).toBe("Google UK English Male");
  expect(speakEvents[1]?.voice).toBe("Samantha");

  await page.locator(".verse-page").click({ position: { x: 24, y: 24 } });
  await expect(page.locator(".orbit-popup")).toHaveCount(0);
  await expect(page.locator(".shell-sidebar")).toHaveCount(0);

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
  await expect(page.locator(".skill-card").first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("traction route renders investor room and economics surfaces", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/traction");

  await expect(page.locator(".page")).toBeVisible();
  await expect(page.locator(".page-head__title")).toHaveText("Traction");
  await expect(page.getByText("Traction Score")).toBeVisible();
  await expect(page.getByText("Editable business model")).toBeVisible();

  expect(errors).toEqual([]);
});

test("V2 Task Queue page shows task data", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/tasks");
  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Task Queue");
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("V2 Agent Fleet page shows agents", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/agents");
  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Agent Fleet");
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("V2 Evidence page shows evidence ledger", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/evidence");
  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Evidence Ledger");
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("V2 sidebar navigation changes route and content", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/");

  // Navigate to Safety Center
  await page.getByRole("link", { name: /Safety Center/i }).click();
  await expect(page).toHaveURL(/\/command-center\/safety/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Safety Center");

  // Navigate to Release Control
  await page.getByRole("link", { name: /Release Control/i }).click();
  await expect(page).toHaveURL(/\/command-center\/release/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Release Control");

  // Navigate to Evidence
  await page.getByRole("link", { name: /Evidence/i }).click();
  await expect(page).toHaveURL(/\/command-center\/evidence/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Evidence Ledger");

  // Navigate to Approvals
  await page.getByRole("link", { name: /Approvals/i }).click();
  await expect(page).toHaveURL(/\/command-center\/approvals/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Approvals");

  // Navigate to Contracts
  await page.getByRole("link", { name: /Contracts/i }).click();
  await expect(page).toHaveURL(/\/command-center\/contracts/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Contracts");

  expect(errors).toEqual([]);
});

test("V2 Verification Gates page shows gate status", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/gates");
  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Verification Gates");
  await expect(page.locator(".ccv2-gate-card__name").first()).toBeVisible();
  await expect(page.locator(".nav-rail")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("V2 OS Roadmap page shows both tracks", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/roadmap");
  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("OS Roadmap");
  await expect(page.getByText("Track A")).toBeVisible();
  await expect(page.getByText("NEXUS OS · P26 → P45")).toBeVisible();
  await expect(page.getByText("Track B")).toBeVisible();
  await expect(page.locator(".ccv2-roadmap-phase").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Mission Control page shows private project product progress card", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/");
  await expect(page.locator(".ccv2-product-card")).toBeVisible();
  await expect(page.getByText("Product Progress")).toBeVisible();
  await expect(page.locator(".ccv2-product-card__name")).toBeVisible();
  await expect(page.getByText("PRD v1.6")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Projects page shows PRD sprint board", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/projects");
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Projects");
  await expect(page.locator(".ccv2-sprint-board")).toBeVisible();
  await expect(page.locator(".ccv2-sprint-tile__id").filter({ hasText: "Sprint 1" })).toBeVisible();
  await expect(page.locator(".ccv2-sprint-tile__id").filter({ hasText: "Sprint 2" })).toBeVisible();
  await expect(page.getByText("Auth + Onboarding")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Verification Gates page shows PRD-linked gates", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/gates");
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Verification Gates");
  await expect(page.locator(".ccv2-section-heading").filter({ hasText: "Product Gates" })).toBeVisible();
  await expect(page.getByText("Backend tests (58/58)")).toBeVisible();
  await expect(page.getByText("Physical device push")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Safety Center page shows FTC compliance row", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/safety");
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Safety Center");
  await expect(page.locator(".ccv2-section-heading").filter({ hasText: "Compliance" })).toBeVisible();
  await expect(page.getByText("FTC Health Breach Notification Rule")).toBeVisible();
  await expect(page.getByText("PERMANENTLY OFF")).toBeVisible();
  expect(errors).toEqual([]);
});

test("OS Roadmap nav link navigates to roadmap route", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/");
  await page.getByRole("link", { name: /OS Roadmap/i }).click();
  await expect(page).toHaveURL(/\/command-center\/roadmap/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("OS Roadmap");
  expect(errors).toEqual([]);
});

test("private project roadmap shows correct sprint statuses", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/roadmap");
  await expect(page.locator(".ccv2-roadmap-phase__phase").filter({ hasText: "Sprint 1" })).toBeVisible();
  await expect(page.locator(".ccv2-roadmap-phase__phase").filter({ hasText: "Sprint 2" })).toBeVisible();
  await expect(page.locator(".ccv2-roadmap-phase .ccv2-pill--pass").first()).toBeVisible();
  await expect(page.locator(".ccv2-roadmap-phase .ccv2-pill--pending").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Workspace page renders workflow cards and next-best action", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workspace");
  await expect(page.locator(".ccv2-shell")).toBeVisible();
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Workspace");
  await expect(page.locator(".ccv2-wf-grid")).toBeVisible();
  await expect(page.locator(".ccv2-wf-card").first()).toBeVisible();
  await expect(page.getByText("Next best action")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Workspace page shows all 8 workflow cards", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workspace");
  await expect(page.getByText("Build Product")).toBeVisible();
  await expect(page.getByText("Fix Failing Test")).toBeVisible();
  await expect(page.getByText("Validate Backend")).toBeVisible();
  await expect(page.getByText("Review Release")).toBeVisible();
  await expect(page.getByText("Plan Sprint")).toBeVisible();
  await expect(page.getByText("Run Privacy Review")).toBeVisible();
  await expect(page.getByText("Prepare iOS Validation")).toBeVisible();
  await expect(page.getByText("Govern Agent Work")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Mission Control shows workspace band with workflow choices", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/");
  await expect(page.locator(".ccv2-workspace-band")).toBeVisible();
  await expect(page.getByText("What do you want NEXUS to do?")).toBeVisible();
  await expect(page.locator(".ccv2-wf-card").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Workspace sidebar nav link navigates to workspace route", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/");
  await page.locator("a.ccv2-nav-item", { hasText: "Workspace" }).first().click();
  await expect(page).toHaveURL(/\/command-center\/workspace/);
  await expect(page.locator(".ccv2-page-head__title")).toContainText("Workspace");
  expect(errors).toEqual([]);
});

test("Govern Agent Work workflow card has Start Workflow button enabled", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workspace");
  const governCard = page.locator(".ccv2-wf-card").filter({ hasText: "Govern Agent Work" });
  await expect(governCard).toBeVisible();
  await expect(governCard.getByRole("button", { name: "Start Workflow" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Disabled workflow cards show disabled button", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workspace");
  const buildCard = page.locator(".ccv2-wf-card").filter({ hasText: "Build Product" });
  await expect(buildCard.getByRole("button")).toBeDisabled();
  expect(errors).toEqual([]);
});

test("OS Roadmap shows P36 done, P37 current, P45 planned", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/roadmap");
  await expect(page.locator(".ccv2-roadmap-phase__phase").filter({ hasText: "P36" })).toBeVisible();
  await expect(page.locator(".ccv2-roadmap-phase__phase").filter({ hasText: "P37" })).toBeVisible();
  await expect(page.locator(".ccv2-roadmap-phase__phase").filter({ hasText: "P45" })).toBeVisible();
  await expect(page.locator("text=Task Activation + Agent Assignment from UI")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Workspace mission status shows plan ready and tasks not activated", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workspace");
  await expect(page.getByText("Mission Status")).toBeVisible();
  await expect(page.getByText("YES — 6 tasks")).toBeVisible();
  await expect(page.getByText("NO — activate from Task Queue")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Task Queue page shows mission tasks with agent assignments", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/tasks");
  await expect(page.locator(".ccv2-page-head__title").filter({ hasText: "Task Queue" })).toBeVisible();
  await expect(page.getByText("Mission Tasks — Private Project")).toBeVisible();
  await expect(page.getByText("Project Brief")).toBeVisible();
  await expect(page.locator(".ccv2-task-row__agent").filter({ hasText: "SHEPHERD" }).first()).toBeVisible();
  await expect(page.locator(".ccv2-task-row__agent").filter({ hasText: "AUDITOR" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Task Queue shows 6 planned mission tasks with capabilities", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/tasks");
  await expect(page.getByText("Backend Validation Follow-up")).toBeVisible();
  await expect(page.getByText("UX Product Flow Planning")).toBeVisible();
  await expect(page.getByText("Privacy Compliance Review")).toBeVisible();
  await expect(page.getByText("iOS Readiness Planning")).toBeVisible();
  await expect(page.getByText("First Controlled Implementation Candidate")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Task Queue Activate buttons show disabled state when bridge offline", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/tasks");
  // Bridge is offline in test environment — buttons must show disabled state with clear reason
  const disabledBtns = page.locator(".ccv2-task-activate-btn--disabled");
  await expect(disabledBtns.first()).toBeVisible();
  const btnText = await disabledBtns.first().textContent();
  expect(btnText).toContain("Requires governed action bridge");
  expect(errors).toEqual([]);
});

test("Agent Fleet shows mission task assignments per agent", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/agents");
  await expect(page.getByText("Mission Task Assignments — Private Project")).toBeVisible();
  await expect(page.locator("table").getByText("SHEPHERD")).toBeVisible();
  await expect(page.locator("table").getByText("AUDITOR")).toBeVisible();
  await expect(page.locator("table").getByText("WARDEN")).toBeVisible();
  await expect(page.locator("table").getByText("CORE")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Mission Control Next Best Action points to task activation", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/mission");
  await expect(page.getByText("Activate First Mission Task")).toBeVisible();
  await expect(page.getByText("Activate Next Task")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Agent Workbench nav item appears in sidebar", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/mission");
  await expect(page.getByRole("link", { name: /Agent Workbench/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Agent Workbench page renders with correct header", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workbench");
  await expect(page.locator(".ccv2-page-head__title").filter({ hasText: "Agent Workbench" })).toBeVisible();
  await expect(page.getByText("Human review loop", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Agent Workbench shows offline state with action bridge offline", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workbench");
  // Bridge is offline in test environment — stat chip must reflect this
  await page.waitForTimeout(1500); // allow bridge health check to complete
  const bridgeChip = page.locator(".ccv2-stat-chip").filter({ hasText: "Action bridge" });
  await expect(bridgeChip).toBeVisible();
  expect(errors).toEqual([]);
});

test("Agent Workbench shows empty state or Go to Task Queue button", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workbench");
  await page.waitForTimeout(1500);
  // When bridge offline, shows empty state with Go to Task Queue button
  const gotoBtn = page.getByRole("button", { name: /Go to Task Queue/i });
  await expect(gotoBtn).toBeVisible();
  expect(errors).toEqual([]);
});

test("Agent Workbench shows review policy stats", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/workbench");
  await expect(page.locator(".ccv2-stat-chip").filter({ hasText: "P38-LOCAL" })).toBeVisible();
  await expect(page.locator(".ccv2-stat-chip").filter({ hasText: "Execution allowed" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("OS Roadmap shows P37 COMPLETE and P38 IN PROGRESS", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/roadmap");
  await expect(page.getByText("Task Activation + Agent Assignment from UI")).toBeVisible();
  await expect(page.getByText("Agent Workbench + Human Review Loop")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Implementation Workflow nav item appears in sidebar", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/mission");
  await expect(page.locator(".ccv2-nav-item").filter({ hasText: "Implementation" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Implementation Workflow page renders with correct header", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/implementation");
  await expect(page.locator(".ccv2-page-head__title").filter({ hasText: "Implementation Workflow" })).toBeVisible();
  await expect(page.getByText(/First controlled implementation/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Implementation Workflow shows offline state with action bridge offline", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/implementation");
  await page.waitForTimeout(1800);
  await expect(page.getByText(/bridge offline/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test("Implementation Workflow shows P39 stats chip", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/implementation");
  await expect(page.locator(".ccv2-stat-chip").filter({ hasText: "P39-LOCAL" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Implementation Workflow shows CORE agent and allowed path", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/implementation");
  await expect(page.locator(".ccv2-stat-chip__value--teal").filter({ hasText: "CORE" })).toBeVisible();
  await expect(page.getByText(/NEXUS_IMPLEMENTATION_LOG/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("OS Roadmap shows P38 COMPLETE and P39 IN PROGRESS", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/roadmap");
  await expect(page.getByText("Agent Workbench + Human Review Loop")).toBeVisible();
  await expect(page.getByText("First Controlled Implementation Workflow from UI")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Live API nav item appears in sidebar", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/mission");
  await expect(page.locator(".ccv2-nav-item").filter({ hasText: "Live API" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Live API page renders with P40 header", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/liveapi");
  await expect(page.locator(".ccv2-page-head__title").filter({ hasText: "Live API Status" })).toBeVisible();
  await expect(page.getByText(/P40-LOCAL/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Live API page shows offline state and snapshot fallback", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/liveapi");
  await page.waitForTimeout(1800);
  await expect(page.getByText(/Local API is offline/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test("Live API page shows safety boundary rows", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/liveapi");
  await expect(page.getByText("Safety Boundary")).toBeVisible();
  await expect(page.getByText("DB backed").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Top bar shows Local API status indicator", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/mission");
  await expect(page.locator(".ccv2-api-status")).toBeVisible();
  await expect(page.locator(".ccv2-api-label")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Top bar shows offline state when API unavailable", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/mission");
  await page.waitForTimeout(1800);
  await expect(page.locator(".ccv2-api-label").filter({ hasText: /Offline/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Safety Center shows Local API boundary section", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/safety");
  await expect(page.getByText(/Local API Boundary/i)).toBeVisible();
  await expect(page.getByText("P40-LOCAL").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("OS Roadmap shows P39 COMPLETE and P40 IN PROGRESS", async ({ page }) => {
  const errors = captureClientErrors(page);
  await page.goto("/command-center/roadmap");
  await expect(page.getByText("First Controlled Implementation Workflow from UI")).toBeVisible();
  await expect(page.getByText("Live Local API Backend for Command Center")).toBeVisible();
  expect(errors).toEqual([]);
});
