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
  buildBreakGlassDecision,
  createBreakGlassRequest,
  summarizeBreakGlassDecision,
  validateBreakGlassRequest,
} from "../policy-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/break-glass-policy-report.md");
const checks = [
  { key: "module", name: "Module", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "decision", name: "Decision model", status: "PASS", details: "" },
  { key: "constraints", name: "Safety constraints", status: "PASS", details: "" },
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

check(existsSync(join(ROOT, "policy-center/breakGlassPolicy.js")), "module", "Missing breakGlassPolicy.js");
const policy = JSON.parse(execFileSync("cat", ["policy/policy-center-break-glass-policy.json"], { cwd: ROOT, encoding: "utf8" }));
check(policy.enabledByDefault === false, "policy", "Break-glass must be disabled by default");
check(policy.automaticApprovalAllowed === false, "policy", "Automatic approval must be disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must remain disabled");

const request = createBreakGlassRequest({
  requester: "operator",
  reason: "Emergency preview requires temporary review path.",
  requestedAction: "preview emergency recovery coordination",
  evidence: ["incident summary"],
  recoveryPlan: "Revert preview state and complete post-action review.",
});
const validation = validateBreakGlassRequest(request);
check(validation.valid, "decision", validation.errors.join("; "));
const decision = buildBreakGlassDecision(request);
const summary = summarizeBreakGlassDecision(decision);
check(decision.decision === "REQUIRES_HUMAN_APPROVAL", "decision", "Valid break-glass preview must require human approval");
check(summary.auditRequired === true, "decision", "Audit must be required");
check(summary.recoveryRequired === true, "decision", "Recovery must be required");
check(summary.enabledByDefault === false, "decision", "Break-glass must not be enabled");
check(summary.previewOnly === true, "decision", "Break-glass must remain preview-only");

const invalid = validateBreakGlassRequest({
  requester: "operator",
  reason: "bad request",
  requestedAction: "disable audit permanently and expose secret",
  evidence: ["incident"],
  recoveryPlan: "none",
});
check(invalid.valid === false, "constraints", "Unsafe break-glass request must be invalid");

const phaseStatus = JSON.parse(execFileSync("cat", ["os-roadmap/phase-status.json"], { cwd: ROOT, encoding: "utf8" }));
const p586 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.6");
check(p586?.status === "complete", "phaseStatus", "P58.6 must be complete");
check(p586?.nextPhase === "P58.7", "phaseStatus", "P58.6 nextPhase must be P58.7");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Decision Summary",
      body: [
        `- Decision: ${summary.decision}`,
        `- Required approvals: ${summary.approvalCount}`,
        `- Required evidence items: ${summary.evidenceCount}`,
        "- Break-glass is disabled by default and remains preview-only.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Break-Glass Policy Report", metadata: { phase: "P58.6 - Break-Glass Policy" } },
);

console.log("NEXUS Break-Glass Policy Check");
console.log("==============================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
