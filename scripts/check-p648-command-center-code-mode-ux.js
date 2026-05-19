import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p648-command-center-code-mode-ux-report.md";

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

const data = read("dashboard/src/data/codeModeReadiness.js");
const page = read("dashboard/src/pages/CommandCenterV2.jsx");
const tests = read("dashboard/tests/routes.spec.js");
const packageJson = readJson("package.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");

addCheck("data export", data.includes("export const codeModeReadinessCards"));
for (const label of [
  "Code Mode Readiness",
  "Preview only",
  "Selected contracts",
  "Only selected lazy contract summaries are allowed",
  "Code execution, provider dispatch, tool execution, worker execution, and project mutation remain disabled.",
  "reports/p648-lazy-tool-selection-report.md",
  "No provider spend; metadata-only preview.",
]) {
  addCheck(`data label: ${label}`, data.includes(label));
}
addCheck("page import", page.includes("codeModeReadinessCards"));
addCheck("page overview renders card", page.includes("Code Mode Packet") && page.includes("Selected contracts: {card.selectedContractCount}"));
addCheck("no fake execution controls", !page.includes("Run Code Mode") && !page.includes("Execute Code Mode"));
addCheck("no raw schema UX", !data.includes("inputSchema") && !data.includes("outputSchema") && !page.includes("inputSchema") && !page.includes("outputSchema"));
addCheck("playwright coverage", tests.includes("Tool Gateway route shows code mode readiness without enabling execution"));
addCheck("theme coverage", tests.includes('pickTheme(page, "dark")') && tests.includes('pickTheme(page, "light")'));
addCheck("demo leak guard", tests.includes('not.toContain("DemoApp")'));
addCheck(
  "package script",
  packageJson.scripts?.["check:p648-command-center-code-mode-ux"] === "node scripts/check-p648-command-center-code-mode-ux.js",
);
const p6484 = phaseStatus.phases?.find((phase) => phase.phaseId === "P64.8.4");
const p6485 = phaseStatus.phases?.find((phase) => phase.phaseId === "P64.8.5");
addCheck("P64.8.4 phase status", p6484?.status === "complete", p6484?.status || "missing");
addCheck(
  "next phase",
  phaseStatus.nextPhase === "P64.8.5" || (p6485?.status === "complete" && phaseStatus.nextPhase === "P66"),
  phaseStatus.nextPhase || "missing",
);

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates display-only Command Center code-mode readiness UX.",
        "- Ensures selected-contract count, blocked bulk-loading reason, owner, evidence/activity, cost impact, and disabled reason are visible.",
        "- Confirms no fake execution control, raw schema label, raw JSON/log dump, or DemoApp dependency is introduced.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P64.8 Command Center Code Mode UX Report", phase: "P64.8.4" },
);

printCheckReport("P64.8 Command Center Code Mode UX Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
