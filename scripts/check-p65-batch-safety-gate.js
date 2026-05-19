import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBatchIntelligenceSafetyGate,
  validateBatchIntelligenceSafetyGate,
} from "../batch-intelligence/batchSafetyGate.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "batch-intelligence/fixtures/batch-safety-gate-fixtures.json";
const REPORT_PATH = "reports/p65-batch-safety-gate-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";

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
const status = readJson(STATUS_PATH);
const gates = fixtures.map((fixture) => ({
  name: fixture.name,
  expectDecision: fixture.expectDecision,
  gate: buildBatchIntelligenceSafetyGate(fixture.input),
}));
const validations = gates.map((entry) => validateBatchIntelligenceSafetyGate(entry.gate));

addCheck("fixture count", fixtures.length >= 2, `${fixtures.length} fixtures`);
addCheck("gate validation", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("decision coverage", gates.some((entry) => entry.gate.decision === "review_ready_preview") && gates.some((entry) => entry.gate.decision === "blocked_preview"));
addCheck("expectations match", gates.every((entry) => entry.gate.decision === entry.expectDecision));
addCheck(
  "upload spend execution disabled",
  gates.every((entry) =>
    entry.gate.uploadAllowed === false &&
    entry.gate.providerUploadAllowed === false &&
    entry.gate.batchSubmissionAllowed === false &&
    entry.gate.providerSpendAllowed === false &&
    entry.gate.executionAllowed === false &&
    entry.gate.workerExecutionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  gates.every((entry) =>
    entry.gate.projectMutationAllowed === false &&
    entry.gate.dbWritesAllowed === false &&
    entry.gate.deployAllowed === false &&
    entry.gate.externalNetworkAllowed === false
  ),
);
addCheck(
  "restricted data blocked",
  gates.some((entry) => entry.gate.dataClassification === "restricted" && entry.gate.decision === "blocked_preview"),
);
addCheck(
  "redaction evidence enforced",
  gates.some((entry) => entry.gate.redactionEvidencePresent === false && entry.gate.blockedReasons.some((reason) => reason.includes("Redaction evidence"))),
);
addCheck(
  "cost preview only",
  gates.every((entry) => entry.gate.costEstimate?.executionAllowed === false && entry.gate.costApproval?.executionAllowed === false),
);
addCheck(
  "display safe labels",
  gates.every((entry) => !JSON.stringify(entry.gate).includes("projects/") && !JSON.stringify(entry.gate).includes("sk-restricted-test-token")),
);
const p654 = status.phases?.find((phase) => phase.phaseId === "P65.4");
addCheck("P65.4 phase status", p654?.status === "complete", p654?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates preview-only batch intelligence cost and safety gates.",
        "- Restricted data and missing redaction evidence are blocked.",
        "- Provider upload, batch submission, provider spend, execution, DB writes, deploy, network calls, workers, and project mutation remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Gates",
      body: gates.map((entry) => `- ${entry.name}: decision=${entry.gate.decision}; approvalRequired=${entry.gate.approvalRequired}`).join("\n"),
    },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P65 Batch Safety Gate Report", phase: "P65.4" },
);

printCheckReport("P65 Batch Safety Gate Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
