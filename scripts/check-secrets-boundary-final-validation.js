import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import { assertNoSecretLikeValuesInFiles } from "../secrets/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/secrets-boundary-final-validation-report.md");
const checks = [
  { key: "reports", name: "P59 reports", status: "PASS", details: "" },
  { key: "secretScan", name: "Secret scan", status: "PASS", details: "" },
  { key: "safety", name: "Safety boundaries", status: "PASS", details: "" },
  { key: "ui", name: "Command Center UX", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "docs", name: "Docs", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];
function read(relativePath) { const fullPath = join(ROOT, relativePath); return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : ""; }
function fail(key, details) { const row = checks.find((item) => item.key === key); if (row) { row.status = "FAIL"; row.details = details; } failures.push(details); }
function check(condition, key, details) { if (!condition) fail(key, details); }
function gitOutput(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }

for (const report of [
  "reports/secret-reference-model-report.md",
  "reports/secret-access-policy-report.md",
  "reports/secret-redaction-report.md",
  "reports/provider-credential-boundary-report.md",
  "reports/project-credential-boundary-report.md",
]) {
  check(existsSync(join(ROOT, report)), "reports", `Missing ${report}`);
  check(read(report).includes("Result\n\nPASS") || read(report).includes("Result: PASS"), "reports", `${report} missing PASS result`);
  check(read(report).includes("Validation HEAD"), "reports", `${report} missing Validation HEAD wording`);
}

const scanFiles = [
  "README.md",
  "docs/architecture/SECRETS_AND_CREDENTIAL_BOUNDARY.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "reports/secret-reference-model-report.md",
  "reports/secret-access-policy-report.md",
  "reports/secret-redaction-report.md",
  "reports/provider-credential-boundary-report.md",
  "reports/project-credential-boundary-report.md",
].map((file) => join(ROOT, file));
const scan = assertNoSecretLikeValuesInFiles(scanFiles);
check(scan.ok, "secretScan", `Secret-like findings: ${scan.findings.length}`);

for (const source of [
  read("policy/secrets-boundary-policy.json"),
  read("policy/secret-access-policy.json"),
  read("policy/provider-credential-boundary-policy.json"),
  read("policy/project-credential-boundary-policy.json"),
]) {
  check(!source.includes("\"providerCallsAllowed\": true"), "safety", "Provider calls enabled");
  check(!source.includes("\"dbWritesAllowed\": true"), "safety", "DB writes enabled");
  check(!source.includes("\"projectMutationAllowed\": true"), "safety", "Project mutation enabled");
  check(!source.includes("\"deployAllowed\": true"), "safety", "Deploy enabled");
  check(!source.includes("\"mobileSigningAllowed\": true"), "safety", "Mobile signing enabled");
}
for (const file of ["secrets/secretReferenceRegistry.js", "secrets/secretAccessPolicy.js", "secrets/providerCredentialBoundary.js"]) {
  check(!read(file).includes("readFileSync(\".env"), "safety", `${file} reads environment files`);
}

check(read("dashboard/tests/routes.spec.js").includes("Secrets Boundary route renders reference-only credential posture"), "ui", "Secrets Boundary Playwright test missing");
check(read("dashboard/src/pages/CommandCenterV2.jsx").includes("NEXUS stores references only"), "ui", "Secrets Boundary UX missing");

const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
const p59 = phaseStatus.phases.find((phase) => phase.phaseId === "P59");
const p597 = phaseStatus.phases.find((phase) => phase.phaseId === "P59.7");
check(p59?.status === "complete", "phaseStatus", "P59 must be complete");
check(p597?.status === "complete", "phaseStatus", "P59.7 must be complete");
check(phaseStatus.currentPhase === "P60" || phaseStatus.nextPhase === "P60", "phaseStatus", "P60 must be current or next");

check(read("README.md").includes("P59: Secrets and Credential Boundary"), "docs", "README missing P59");
check(read("README.md").includes("P60: Worker Queue + Runtime Engine"), "docs", "README missing P60 next");
check(read("docs/codebase/MODULE_OWNERSHIP.md").includes("secrets"), "docs", "Module ownership missing secrets");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: "- P59 closes with reference-only credential boundaries.\n- Raw secret values were not read or exposed.\n- P60 Worker Queue + Runtime Engine is next." },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Secrets Boundary Final Validation Report", metadata: { phase: "P59.7 - Secrets Boundary Final Validation" } },
);
console.log("NEXUS Secrets Boundary Final Validation Check");
console.log("=============================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
