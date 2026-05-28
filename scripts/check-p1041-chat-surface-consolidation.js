import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1041-chat-surface-consolidation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const source = readText("dashboard/src/pages/CommandCenterV2.jsx");
const styles = readText("dashboard/src/styles-command-center-v2.css");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText("docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const phaseStatusSource = readText("scripts/check-os-phase-status.js");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1041 = subphaseById.get("P104.1") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const chatFunctionMatch = source.match(/function CommandCenterLitePage\(\) \{[\s\S]*?\nfunction AgentFlowPanel/);
const chatSource = chatFunctionMatch ? chatFunctionMatch[0] : "";
const nonChatLabels = [
  "Local PRD readiness",
  "Local PRD review gate",
  "Local agent task board",
  "Founder workflow summary",
  "Founder DB workflow",
  "Business Build DB CRUD",
  "Live workstream handoff",
  "Execution admission readiness",
  "Founder live use readiness",
  "Founder live handoff",
  "Founder live work admission",
  "Founder persistence controls",
  "Agent action flow",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1041-chat-surface-consolidation"]));
addCheck("contract phase identity", contract.phaseId === "P104" && contract.title === "Founder Live Execution Boundary");
addCheck("P104.1 complete and later subphases planned or complete", p1041.status === "complete" && ["P104.2", "P104.3", "P104.4", "P104.5", "P104.6", "P104.7"].every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck(
  "Chat route keeps chat controls",
  chatSource.includes('aria-label="Chat with NEXUS"')
    && chatSource.includes("Founder message")
    && />\s*Send\s*</.test(chatSource)
    && />\s*Reset\s*</.test(chatSource)
    && chatSource.includes('aria-label="Founder prompt starters"'),
);
addCheck("Chat route removes non-chat cards", nonChatLabels.every((label) => !chatSource.includes(label)), nonChatLabels.filter((label) => chatSource.includes(label)).join(", "));
addCheck("Chat route uses chat-only layout", chatSource.includes("ccv2-lite-layout--chat-only") && styles.includes(".ccv2-lite-layout--chat-only"));
addCheck("dedicated route coverage retained", routeTests.includes("Founder DB workflow appears in Business Build and DB Runtime") && routeTests.includes("Business Build DB CRUD state appears in Business Build, Agent Flow, and DB Runtime") && routeTests.includes("Founder live work admission appears across founder routes"));
addCheck("Chat-only Playwright coverage added", routeTests.includes("Command Center Lite route stays chat-only") && nonChatLabels.every((label) => routeTests.includes(`getByLabel("${label}")`) || routeTests.includes(`getByLabel('${label}')`)));
addCheck("Lite tests no longer expect non-chat panels", !routeTests.includes("Lite Founder Work Admission") && !routeTests.includes("Lite Business Build DB workflow") && !routeTests.includes("Lite Live Workstream Handoff") && !routeTests.includes("Lite Execution Admission"));
addCheck("plan records P104.1 complete", /P104\.1 Chat Surface Consolidation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P104.1", /P104 - Founder Live Execution Boundary/.test(platformRoadmap) && /P104\.1 is\s+complete/.test(platformRoadmap) && /P104\.2 is\s+next/.test(platformRoadmap));
addCheck("README records P104 current status", /Current Status Through P104\.1/.test(readme) && /P104\.1 founder chat surface consolidation/.test(readme));
addCheck(
  "phase status advanced to P104.1",
  ["P104.1", "P104.2", "P104.3", "P104.4", "P104.5", "P104.6", "P104.7"].includes(status.currentPhase)
    && ["P103.7", "P104.1", "P104.2", "P104.3", "P104.4", "P104.5", "P104.6"].includes(status.previousPhase)
    && ["P104.2", "P104.3", "P104.4", "P104.5", "P104.6", "P104.7", "P105"].includes(status.nextPhase)
    && statusById.get("P104")?.status === "in_progress"
    && statusById.get("P104.1")?.status === "complete"
    && roadmapById.get("P104.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("phase status checker accepts P104 subphases", ["P104.1", "P104.2", "P104.3", "P104.4", "P104.5", "P104.6", "P104.7"].every((phaseId) => phaseStatusSource.includes(`"${phaseId}"`)));
addCheck("P104.1 avoids forbidden file scope", !(p1041.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(chatSource));
addCheck("primary UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(chatSource));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(chatSource));
addCheck("full Command Center demo leakage safety retained", routeTests.includes("full Command Center routes do not show DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P104.1 Chat with NEXUS surface consolidation.",
        "- Confirms Chat is chat-only while PRD, DB, agent, live handoff, live-use, execution admission, persistence, and work-admission details stay on dedicated pages.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1041-chat-surface-consolidation",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite route renders interactive founder chat|Command Center Lite route stays chat-only|Founder DB workflow appears in Business Build and DB Runtime|Business Build DB CRUD state appears in Business Build, Agent Flow, and DB Runtime|Founder live work admission appears across founder routes|full Command Center demo leakage safety\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.1 is Chat UX consolidation only. P104.2-P104.7 remain planned and no live execution authority is enabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.1 Chat Surface Consolidation Report", phase: "P104.1" },
);

printCheckReport("P104.1 Chat Surface Consolidation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
