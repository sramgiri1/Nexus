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
  evaluateProviderCredentialReadiness,
  getProviderCredentialBoundary,
  listProviderCredentialReferences,
  summarizeProviderCredentialBoundary,
  validateProviderCredentialReference,
} from "../secrets/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/provider-credential-boundary-report.md");
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

const boundary = getProviderCredentialBoundary();
const refs = listProviderCredentialReferences();
const summary = summarizeProviderCredentialBoundary();
check(boundary.providerCallsAllowed === false, "boundary", "Provider calls must be disabled");
check(boundary.credentialValuesReadable === false, "boundary", "Credential values must not be readable");
for (const provider of ["openai", "anthropic", "github", "slack-placeholder", "jira-linear-placeholder", "cloud-provider-placeholder"]) {
  check(refs.some((ref) => ref.provider === provider), "references", `Missing provider reference: ${provider}`);
  check(["reference_not_configured", "metadata_ready", "blocked_until_provider_dispatch"].includes(evaluateProviderCredentialReadiness(provider)), "references", `Invalid readiness for ${provider}`);
}
for (const ref of refs) {
  const validation = validateProviderCredentialReference(ref);
  check(validation.valid, "references", `${ref.provider}: ${validation.errors.join("; ")}`);
}
const policy = JSON.parse(readFileSync(join(ROOT, "policy/provider-credential-boundary-policy.json"), "utf8"));
check(policy.providerCallsAllowed === false, "policy", "Policy enabled provider calls");
check(policy.credentialValuesReadable === false, "policy", "Policy enabled credential reads");

const phaseStatus = JSON.parse(readFileSync(join(ROOT, "os-roadmap/phase-status.json"), "utf8"));
const p594 = phaseStatus.phases.find((phase) => phase.phaseId === "P59.4");
check(p594?.status === "complete", "phaseStatus", "P59.4 must be complete");
check(p594?.nextPhase === "P59.5", "phaseStatus", "P59.4 nextPhase must be P59.5");
const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: `- Provider references: ${summary.totalProviders}\n- Metadata ready: ${summary.metadataReady}\n- Provider calls allowed: ${summary.providerCallsAllowed}` },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Provider Credential Boundary Report", metadata: { phase: "P59.4 - Provider Credential Boundary" } },
);
console.log("NEXUS Provider Credential Boundary Check");
console.log("========================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
