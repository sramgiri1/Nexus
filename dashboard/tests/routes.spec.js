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
  await expect(page.getByText("58/58")).toBeVisible();
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
