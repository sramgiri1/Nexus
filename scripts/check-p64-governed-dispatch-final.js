import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { createDispatchEnvelope, validateDispatchEnvelope } from "../dispatch-governance/dispatchEnvelope.js";
import { evaluateDispatchPolicy, validateDispatchPolicyDecision } from "../dispatch-governance/dispatchPolicy.js";
import { buildDispatchReadinessMatrix, validateDispatchReadinessMatrix } from "../dispatch-governance/dispatchReadinessMatrix.js";
import { buildDispatchDryRun, validateDispatchDryRun } from "../dispatch-governance/dispatchDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p64-governed-dispatch-final-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REQUIRED_REPORTS = [
  "reports/p64-execution-plan-report.md",
  "reports/p64-dispatch-envelope-report.md",
  "reports/p64-dispatch-readiness-report.md",
  "reports/p64-dispatch-dry-run-report.md",
  "reports/p64-command-center-dispatch-ux-report.md",
];

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

const status = readJson(STATUS_PATH);
const phaseById = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
const envelope = createDispatchEnvelope({
  dispatchId: "p64_final_provider_dispatch_preview",
  requestType: "provider.request",
  providerId: "openai-preview",
  capabilityId: "provider-dispatch-preview",
  requestSummary: "Final P64 governed dispatch validation preview.",
  safeSummary: { displayLabel: "P64 final dispatch preview" },
  evidenceRefs: [REPORT_PATH],
  auditRefs: ["local-state/runtime/activity.jsonl"],
});
const envelopeValidation = validateDispatchEnvelope(envelope);
const policyDecision = evaluateDispatchPolicy({ envelope });
const policyValidation = validateDispatchPolicyDecision(policyDecision);
const readiness = buildDispatchReadinessMatrix();
const readinessValidation = validateDispatchReadinessMatrix(readiness);
const dryRun = buildDispatchDryRun({ envelope });
const dryRunValidation = validateDispatchDryRun(dryRun);

addCheck("required reports exist", REQUIRED_REPORTS.every((report) => existsSync(join(ROOT, report))), REQUIRED_REPORTS.filter((report) => !existsSync(join(ROOT, report))).join(", "));
addCheck("P64.1-P64.6 status", ["P64.1", "P64.2", "P64.3", "P64.4", "P64.5", "P64.6"].every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P64 remains in progress", phaseById.get("P64")?.status === "in_progress", phaseById.get("P64")?.status || "missing");
addCheck("envelope valid", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("policy valid", policyValidation.valid, policyValidation.errors.join("; "));
addCheck("readiness valid", readinessValidation.valid, readinessValidation.errors.join("; "));
addCheck("dry run valid", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck(
  "execution disabled",
  envelope.executionAllowed === false &&
    policyDecision.executionAllowed === false &&
    readiness.executionAllowed === false &&
    dryRun.executionAllowed === false &&
    dryRun.executed === false,
);
addCheck(
  "mutation boundaries disabled",
  envelope.projectMutationAllowed === false &&
    envelope.dbWritesAllowed === false &&
    envelope.deployAllowed === false &&
    envelope.externalNetworkAllowed === false &&
    dryRun.projectMutationAllowed === false &&
    dryRun.dbWritesAllowed === false &&
    dryRun.deployAllowed === false &&
    dryRun.externalNetworkAllowed === false,
);
addCheck("Command Center UX report", read("reports/p64-command-center-dispatch-ux-report.md").includes("Result\n\nPASS"));

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P64 governed dispatch checks through P64.6.",
        "- Provider dispatch, tool execution, project mutation, DB writes, deploy, network calls, and worker execution remain disabled.",
        "- Cost remains estimate-only and Command Center surfaces remain display-only.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Known Limitations",
      body: [
        "- P64 does not enable real dispatch.",
        "- P64.7 final validation is still required before parent P64 closure.",
        "- Code Mode Runtime + Lazy Tool Loading remains a later phase.",
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
    title: "P64 Governed Dispatch Final Report",
    phase: "P64.6",
  },
);

printCheckReport("P64 Governed Dispatch Final Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
