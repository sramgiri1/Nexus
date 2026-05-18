import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  createDispatchEnvelopeResult,
  validateDispatchEnvelope,
} from "../dispatch-governance/dispatchEnvelope.js";
import {
  evaluateDispatchPolicy,
  validateDispatchPolicyDecision,
} from "../dispatch-governance/dispatchPolicy.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "dispatch-governance/fixtures/dispatch-envelope-fixtures.json";
const REPORT_PATH = "reports/p64-dispatch-envelope-report.md";
const PHASE_STATUS_PATH = "os-roadmap/phase-status.json";

const checks = [];
const failures = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const fixtures = readJson(FIXTURE_PATH).fixtures || [];
const status = readJson(PHASE_STATUS_PATH);
const results = fixtures.map((fixture) => {
  const envelopeResult = createDispatchEnvelopeResult(fixture.input);
  const policyDecision = evaluateDispatchPolicy({ envelope: envelopeResult.envelope });
  const policyValidation = validateDispatchPolicyDecision(policyDecision);
  return {
    name: fixture.name,
    envelope: envelopeResult.envelope,
    envelopeValidation: validateDispatchEnvelope(envelopeResult.envelope),
    resultValidation: envelopeResult.resultValidation,
    policyDecision,
    policyValidation,
  };
});

addCheck("fixture count", fixtures.length >= 2, `${fixtures.length} fixtures`);
addCheck(
  "envelope validation",
  results.every((result) => result.envelopeValidation.valid),
  results.flatMap((result) => result.envelopeValidation.errors).join("; "),
);
addCheck(
  "policy validation",
  results.every((result) => result.policyValidation.valid),
  results.flatMap((result) => result.policyValidation.errors).join("; "),
);
addCheck(
  "result envelope reuse",
  results.every((result) => result.resultValidation.valid),
  results.flatMap((result) => result.resultValidation.errors).join("; "),
);
addCheck(
  "execution disabled",
  results.every((result) =>
    result.envelope.executionAllowed === false &&
    result.envelope.providerDispatchAllowed === false &&
    result.envelope.toolExecutionAllowed === false &&
    result.policyDecision.executionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  results.every((result) =>
    result.envelope.projectMutationAllowed === false &&
    result.envelope.dbWritesAllowed === false &&
    result.envelope.deployAllowed === false &&
    result.envelope.externalNetworkAllowed === false
  ),
);
addCheck(
  "redaction applied",
  results.every((result) => result.envelope.safeSummary.rawPayloadStored === false && result.envelope.rawPayloadStored === false),
);
addCheck(
  "display safe labels",
  results.every((result) =>
    result.envelope.scopeLabel &&
    !result.envelope.scopeLabel.includes("projects/") &&
    !JSON.stringify(result.envelope.safeSummary).includes("projects/")
  ),
);
const p64 = status.phases?.find((phase) => phase.phaseId === "P64");
const p642 = status.phases?.find((phase) => phase.phaseId === "P64.2");
addCheck("P64 remains in progress", p64?.status === "in_progress", p64?.status || "missing");
addCheck("P64.2 phase status", p642?.status === "complete", p642?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates pure P64.2 dispatch envelopes and policy decisions.",
        "- Does not execute providers, tools, project mutation, DB writes, deploy, network calls, or worker runtime.",
        "- Fixtures use public-safe labels and redacted payload summaries.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Validated Fixtures",
      body: results
        .map((result) => `- ${result.name}: ${result.policyDecision.state}; ${result.policyDecision.disabledReason}`)
        .join("\n"),
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
    title: "P64 Dispatch Envelope Report",
    phase: "P64.2",
  },
);

printCheckReport("P64 Dispatch Envelope Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
