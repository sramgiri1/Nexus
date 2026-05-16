import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  evaluateProjectCredentialBoundary,
  getProjectCredentialBoundary,
  listProjectCredentialReferences,
  summarizeProjectCredentialBoundary,
  validateProjectCredentialReference,
} from "../secrets/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/project-credential-boundary-report.md");
const checks = [
  { key: "boundary", name: "Boundary", status: "PASS", details: "" },
  { key: "references", name: "References", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];
function fail(key, details) { const row = checks.find((item) => item.key === key); if (row) { row.status = "FAIL"; row.details = details; } failures.push(details); }
function check(condition, key, details) { if (!condition) fail(key, details); }
function gitOutput(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }

const boundary = getProjectCredentialBoundary("private-project");
const refs = listProjectCredentialReferences("private-project");
const summary = summarizeProjectCredentialBoundary("private-project");
for (const category of ["app_database", "ci_cd", "deployment", "mobile_signing", "oauth", "notification_service", "payment_provider", "storage_provider"]) {
  check(refs.some((ref) => ref.provider === category), "references", `Missing category ${category}`);
}
for (const ref of refs) {
  const validation = validateProjectCredentialReference(ref);
  check(validation.valid, "references", `${ref.provider}: ${validation.errors.join("; ")}`);
}
check(boundary.dbWritesAllowed === false, "boundary", "DB writes must be disabled");
check(boundary.deployAllowed === false, "boundary", "Deploy must be disabled");
check(boundary.mobileSigningAllowed === false, "boundary", "Mobile signing must be disabled");
check(evaluateProjectCredentialBoundary("private-project", "deploy") === "blocked", "boundary", "Deploy action must be blocked");
check(evaluateProjectCredentialBoundary("private-project", "export_package") === "redacted_metadata_only", "boundary", "Exports must be redacted metadata only");
const policy = JSON.parse(readFileSync(join(ROOT, "policy/project-credential-boundary-policy.json"), "utf8"));
check(policy.demoModePrivateCredentialMetadataAllowed === false, "policy", "Demo mode must not expose private credential metadata");
check(policy.exportSecretReferencesAllowed === false, "policy", "Export must exclude secret references");

const phaseStatus = JSON.parse(readFileSync(join(ROOT, "os-roadmap/phase-status.json"), "utf8"));
const p595 = phaseStatus.phases.find((phase) => phase.phaseId === "P59.5");
check(p595?.status === "complete", "phaseStatus", "P59.5 must be complete");
check(p595?.nextPhase === "P59.6", "phaseStatus", "P59.5 nextPhase must be P59.6");
const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: `- Project credential categories: ${summary.referenceCount}\n- Blocked references: ${summary.blockedReferences}\n- Deploy allowed: ${summary.deployAllowed}\n- DB writes allowed: ${summary.dbWritesAllowed}` },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Project Credential Boundary Report", metadata: { phase: "P59.5 - Project Credential Boundary" } },
);
console.log("NEXUS Project Credential Boundary Check");
console.log("=======================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
