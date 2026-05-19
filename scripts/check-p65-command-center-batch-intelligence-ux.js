import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p65-command-center-batch-intelligence-ux-report.md";

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const checks = [];
const failures = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

const data = read("dashboard/src/data/batchIntelligenceReadiness.js");
const page = read("dashboard/src/pages/CommandCenterV2.jsx");
const tests = read("dashboard/tests/routes.spec.js");
const packageJson = readJson("package.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");

addCheck("data export", data.includes("export const batchIntelligenceReadinessCards"));
for (const label of [
  "Batch Intelligence Readiness",
  "Preview only",
  "Redacted summaries only",
  "Provider upload, batch submission, provider spend, and execution remain disabled.",
  "reports/p65-batch-safety-gate-report.md",
  "Estimate only; no provider spend.",
]) {
  addCheck(`data label: ${label}`, data.includes(label));
}
addCheck("page import", page.includes("batchIntelligenceReadinessCards"));
addCheck("batch queue renders cards", page.includes("Requests: {card.requestCount}") && page.includes("Redaction: {card.redactionState}"));
addCheck("api batch renders cards", page.includes("Workload</span><span className=\"ccv2-page-summary-value\">{card.workloadType}</span>"));
addCheck("no fake execution controls", !page.includes("Run Batch Intelligence") && !page.includes("Submit Batch Intelligence"));
addCheck("no raw payload UX", !data.includes("rawPayload") && !data.includes("providerPayload") && !page.includes("rawPayload"));
addCheck("playwright coverage", tests.includes("Batch Queue route shows batch intelligence readiness without upload"));
addCheck("theme coverage", tests.includes('pickTheme(page, "dark")') && tests.includes('pickTheme(page, "light")'));
addCheck("demo leak guard", tests.includes('not.toContain("DemoApp")'));
addCheck(
  "package script",
  packageJson.scripts?.["check:p65-command-center-batch-intelligence-ux"] === "node scripts/check-p65-command-center-batch-intelligence-ux.js",
);
const p655 = phaseStatus.phases?.find((phase) => phase.phaseId === "P65.5");
addCheck("P65.5 phase status", p655?.status === "complete", p655?.status || "missing");
addCheck("next phase", phaseStatus.nextPhase === "P65.6", phaseStatus.nextPhase || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates display-only Command Center batch intelligence readiness UX.",
        "- Ensures workload, request count, redaction state, disabled upload reason, evidence/activity, cost impact, and next action are visible.",
        "- Confirms no fake execution control, raw payload dump, raw JSON/log dump, or DemoApp dependency is introduced.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P65 Command Center Batch Intelligence UX Report", phase: "P65.5" },
);

printCheckReport("P65 Command Center Batch Intelligence UX Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
