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
    errors.push(`console: ${text}`);
  });

  return errors;
}

test("home route renders command center with local read-only wiring", async ({ page }) => {
  const errors = captureClientErrors(page);

  await page.goto("/");

  await expect(page.locator(".page--command")).toBeVisible();
  await expect(page.getByRole("heading", { name: "NEXUS Command Center" })).toBeVisible();
  await expect(page.getByRole("banner").getByText("Environment · Prototype")).toBeVisible();
  await expect(page.locator(".command-prototype__sidebar")).toBeVisible();
  await expect(page.getByRole("link", { name: /Mission Control/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Release/i })).toBeVisible();
  await expect(page.getByText("Build and validate DemoApp through governed NEXUS agents.")).toBeVisible();
  await expect(page.getByRole("banner").getByText("Active project · DemoApp")).toBeVisible();
  await expect(page.getByText("Read-only local visibility")).toBeVisible();
  await expect(page.locator("#local-os")).toContainText("Runtime Traffic Plane");
  await expect(page.locator("#local-os")).toContainText("Identity Propagation");
  await expect(page.locator("#validation")).toContainText("Validation Status");
  await expect(page.locator("#local-evidence")).toContainText("Local Evidence");
  await expect(page.locator("#demo-mode")).toContainText("Not Wired Yet");
  await expect(page.locator("#demo-mode")).toContainText("No live API");
  await expect(page.locator("#tasks")).toContainText("Task queue");
  await expect(page.locator("#gates")).toContainText("AUDITOR, SENTINEL, and WARDEN");
  await expect(page.locator("#evidence")).toContainText("Evidence timeline");
  await expect(page.locator("#release")).toContainText("Release Control");
  await expect(page.locator("#demo-mode")).toContainText("No real provider calls");
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
