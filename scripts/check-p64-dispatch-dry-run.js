import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildDispatchDryRun, validateDispatchDryRun } from "../dispatch-governance/dispatchDryRun.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "dispatch-governance/fixtures/dispatch-dry-run-fixtures.json";
const REPORT_PATH = "reports/p64-dispatch-dry-run-report.md";
const PHASE_STATUS_PATH = "os-roadmap/phase-status.json";

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

const fixtures = readJson(FIXTURE_PATH).fixtures || [];
const status = readJson(PHASE_STATUS_PATH);
const dryRuns = fixtures.map((fixture) => ({
  name: fixture.name,
  dryRun: buildDispatchDryRun(fixture.input),
}));
const validations = dryRuns.map((entry) => validateDispatchDryRun(entry.dryRun));

addCheck("fixture count", fixtures.length >= 2, `${fixtures.length} fixtures`);
addCheck("dry-run validation", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck(
  "not executed",
  dryRuns.every((entry) => entry.dryRun.executed === false && entry.dryRun.dryRunOnly === true),
);
addCheck(
  "execution disabled",
  dryRuns.every((entry) =>
    entry.dryRun.executionAllowed === false &&
    entry.dryRun.providerDispatchAllowed === false &&
    entry.dryRun.toolExecutionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  dryRuns.every((entry) =>
    entry.dryRun.projectMutationAllowed === false &&
    entry.dryRun.dbWritesAllowed === false &&
    entry.dryRun.deployAllowed === false &&
    entry.dryRun.externalNetworkAllowed === false
  ),
);
addCheck(
  "operator fields present",
  dryRuns.every((entry) =>
    entry.dryRun.nextAction &&
    entry.dryRun.blocker &&
    entry.dryRun.disabledReason &&
    entry.dryRun.evidenceLocation &&
    entry.dryRun.activityLocation &&
    entry.dryRun.costImpact
  ),
);
const p644 = status.phases?.find((phase) => phase.phaseId === "P64.4");
addCheck("P64.4 phase status", p644?.status === "complete", p644?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates non-executing dispatch dry-run previews.",
        "- Does not execute providers, tools, project mutation, DB writes, deploy, network calls, or worker runtime.",
        "- Dry runs expose disabled reason, blocker, next action, evidence/activity location, and cost impact.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Dry Runs",
      body: dryRuns.map((entry) => `- ${entry.name}: ${entry.dryRun.currentState}; executed=${entry.dryRun.executed}`).join("\n"),
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
    title: "P64 Dispatch Dry Run Report",
    phase: "P64.4",
  },
);

printCheckReport("P64 Dispatch Dry Run Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
