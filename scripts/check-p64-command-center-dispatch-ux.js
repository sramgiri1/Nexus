import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const DATA_PATH = "dashboard/src/data/dispatchGovernance.js";
const PAGE_PATH = "dashboard/src/pages/CommandCenterV2.jsx";
const TEST_PATH = "dashboard/tests/routes.spec.js";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p64-command-center-dispatch-ux-report.md";

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

const data = read(DATA_PATH);
const page = read(PAGE_PATH);
const tests = read(TEST_PATH);
const status = readJson(STATUS_PATH);
const p645 = status.phases?.find((phase) => phase.phaseId === "P64.5");

addCheck("data module exists", existsSync(join(ROOT, DATA_PATH)));
addCheck("page imports dispatch governance", page.includes("dispatchGovernanceSummary") && page.includes("dispatchReadinessCards"));
addCheck(
  "operator fields",
  ["currentState", "nextAction", "blocker", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => data.includes(field)),
);
addCheck(
  "governance pages updated",
  ["Tool Dispatch", "Governed Dispatch Dry Run", "Dispatch Governance"].every((label) => page.includes(label)),
);
addCheck(
  "no execution claims",
  !data.includes("Enabled") &&
    !page.includes("provider dispatch enabled") &&
    !page.includes("tool execution enabled") &&
    data.includes("Dry-run only") &&
    data.includes("Readiness only"),
);
addCheck(
  "forbidden UX absent",
  !data.includes("DemoApp") &&
    !data.includes("projects/") &&
    !data.includes("raw JSON") &&
    !data.includes("providerCallsAllowed") &&
    page.includes("Raw policy JSON is intentionally not shown in primary UX."),
);
addCheck(
  "playwright coverage",
  tests.includes("Governed Dispatch Dry Run") &&
    tests.includes("reports/p64-dispatch-readiness-report.md") &&
    tests.includes("reports/p64-dispatch-envelope-report.md"),
);
addCheck("P64.5 phase status", p645?.status === "complete", p645?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates display-only Command Center dispatch readiness and dry-run UX.",
        "- Does not enable providers, tools, project mutation, DB writes, deploy, network calls, or worker runtime.",
        "- Primary UX shows state, next action, blocker, disabled reason, owner, evidence/activity location, and cost impact.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Failures",
      body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n"),
    },
    {
      title: "Result",
      body: failures.length === 0 ? "PASS" : "FAIL",
    },
  ],
  {
    title: "P64 Command Center Dispatch UX Report",
    phase: "P64.5",
  },
);

printCheckReport("P64 Command Center Dispatch UX Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
