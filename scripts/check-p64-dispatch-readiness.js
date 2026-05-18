import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildDispatchReadinessMatrix,
  validateDispatchReadinessMatrix,
} from "../dispatch-governance/dispatchReadinessMatrix.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "dispatch-governance/fixtures/dispatch-readiness-fixtures.json";
const REPORT_PATH = "reports/p64-dispatch-readiness-report.md";
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

const fixture = readJson(FIXTURE_PATH).expected;
const status = readJson(PHASE_STATUS_PATH);
const matrix = buildDispatchReadinessMatrix();
const validation = validateDispatchReadinessMatrix(matrix);
const providerRecords = matrix.records.filter((record) => record.kind === "provider");
const toolRecords = matrix.records.filter((record) => record.kind === "tool");

addCheck("matrix validation", validation.valid, validation.errors.join("; "));
addCheck("provider count", providerRecords.length >= fixture.minimumProviderCount, `${providerRecords.length} providers`);
addCheck("tool count", toolRecords.length >= fixture.minimumToolCount, `${toolRecords.length} tools`);
addCheck(
  "required readiness states",
  fixture.requiredStates.every((state) => matrix.summary.readinessStates.includes(state)),
  matrix.summary.readinessStates.join(", "),
);
addCheck(
  "execution disabled",
  matrix.executionAllowed === false &&
    matrix.providerDispatchAllowed === false &&
    matrix.toolExecutionAllowed === false &&
    matrix.records.every((record) => record.executionAllowed === false),
);
addCheck(
  "mutation boundaries disabled",
  matrix.records.every((record) =>
    record.projectMutationAllowed === false &&
    record.dbWritesAllowed === false &&
    record.deployAllowed === false &&
    record.externalNetworkAllowed === false
  ),
);
addCheck(
  "display safe labels",
  matrix.records.every((record) => !record.displayLabel.includes("projects/") && !record.disabledReason.includes("projects/")),
);
const p643 = status.phases?.find((phase) => phase.phaseId === "P64.3");
addCheck("P64.3 phase status", p643?.status === "complete", p643?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates read-only provider and tool readiness records.",
        "- Does not execute providers, tools, project mutation, DB writes, deploy, network calls, or worker runtime.",
        "- Uses existing provider registry and tool registry/permission helpers.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Summary",
      body: [
        `- Providers: ${providerRecords.length}`,
        `- Tools: ${toolRecords.length}`,
        `- Approval required: ${matrix.summary.approvalRequiredCount}`,
        `- States: ${matrix.summary.readinessStates.join(", ")}`,
      ].join("\n"),
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
    title: "P64 Dispatch Readiness Report",
    phase: "P64.3",
  },
);

printCheckReport("P64 Dispatch Readiness Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
