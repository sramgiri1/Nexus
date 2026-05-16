import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  buildPolicyExceptionDecision,
  createPolicyExceptionRequest,
  summarizePolicyException,
  validatePolicyExceptionRequest,
} from "../policy-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/policy-exception-workflow-report.md");
const checks = [
  { key: "module", name: "Module", status: "PASS", details: "" },
  { key: "classification", name: "Exception classification", status: "PASS", details: "" },
  { key: "constraints", name: "Exception constraints", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function fail(key, details) {
  const row = checks.find((item) => item.key === key);
  if (row) {
    row.status = "FAIL";
    row.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) fail(key, details);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

check(existsSync(join(ROOT, "policy-center/policyExceptionWorkflow.js")), "module", "Missing exception workflow module");

const samples = [
  createPolicyExceptionRequest({ policyId: "docs", reason: "temporary docs copy review", riskLevel: "low" }),
  createPolicyExceptionRequest({ policyId: "approval", reason: "temporary threshold review", riskLevel: "medium" }),
  createPolicyExceptionRequest({ policyId: "tool", reason: "temporary tool permission review", riskLevel: "high" }),
  createPolicyExceptionRequest({ policyId: "public", reason: "attempt to weaken public boundary", riskLevel: "critical", requestedChange: "public/demo boundary weakening" }),
];
const decisions = samples.map(buildPolicyExceptionDecision);
const summaries = decisions.map(summarizePolicyException);
check(decisions[0].status === "requires_human_approval", "classification", "Low risk must require human approval");
check(decisions[1].status === "requires_auditor_review", "classification", "Medium risk must require AUDITOR review");
check(decisions[2].status === "requires_warden_review", "classification", "High risk must require WARDEN review");
check(decisions[2].requiredApprovals.includes("AUDITOR"), "classification", "High risk must include AUDITOR");
check(decisions[3].status === "denied", "classification", "Critical boundary weakening must be denied");
check(decisions.every((decision) => decision.previewOnly === true), "constraints", "Exceptions must be preview-only");
check(decisions.every((decision) => decision.liveOverrideEnabled === false), "constraints", "Live overrides must not be enabled");
const indefinite = validatePolicyExceptionRequest({ policyId: "x", reason: "indefinite request", duration: "indefinite" });
check(indefinite.valid === false, "constraints", "Indefinite exceptions must be invalid");

const phaseStatus = JSON.parse(execFileSync("cat", ["os-roadmap/phase-status.json"], { cwd: ROOT, encoding: "utf8" }));
const p585 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.5");
check(p585?.status === "complete", "phaseStatus", "P58.5 must be complete");
check(p585?.nextPhase === "P58.6", "phaseStatus", "P58.5 nextPhase must be P58.6");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Exception Decision Preview",
      body: [
        "| Policy | Status | Risk | Approvals | Evidence |",
        "| --- | --- | --- | --- | --- |",
        ...summaries.map((item) => (
          `| ${item.policyId} | ${item.status} | ${item.riskLevel} | ${item.approvalCount} | ${item.evidenceCount} |`
        )),
      ].join("\n"),
    },
    { title: "Non-Goals", body: "- No live policy override is enabled.\n- No break-glass model is enabled in this subphase." },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Policy Exception Workflow Report", metadata: { phase: "P58.5 - Exception Workflow" } },
);

console.log("NEXUS Policy Exception Workflow Check");
console.log("=====================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
