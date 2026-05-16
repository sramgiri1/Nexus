import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  REDACTION_FIXTURES,
  assertNoSecretLikeValuesInFiles,
  redactSecretLikeText,
  scanTextForSecretLikeValues,
} from "../secrets/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/secret-redaction-report.md");
const checks = [
  { key: "patterns", name: "Patterns", status: "PASS", details: "" },
  { key: "fixtures", name: "Fixtures", status: "PASS", details: "" },
  { key: "outputs", name: "Output scan", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];
function fail(key, details) { const row = checks.find((item) => item.key === key); if (row) { row.status = "FAIL"; row.details = details; } failures.push(details); }
function check(condition, key, details) { if (!condition) fail(key, details); }
function gitOutput(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }

for (const fixture of REDACTION_FIXTURES) {
  const findings = scanTextForSecretLikeValues(fixture.input);
  check((findings.length > 0) === fixture.shouldFlag, "fixtures", `${fixture.label} expectation mismatch`);
  if (fixture.shouldFlag) check(redactSecretLikeText(fixture.input).includes("[REDACTED_SECRET]"), "fixtures", `${fixture.label} not redacted`);
}
check(scanTextForSecretLikeValues("sk-activation").length === 0, "patterns", "sk-activation allowlist failed");

const scannedFiles = [
  "docs/architecture/SECRETS_AND_CREDENTIAL_BOUNDARY.md",
  "reports/secret-reference-model-report.md",
  "reports/secret-access-policy-report.md",
  "dashboard/src/pages/CommandCenterV2.jsx",
].map((file) => join(ROOT, file));
const outputScan = assertNoSecretLikeValuesInFiles(scannedFiles);
check(outputScan.ok, "outputs", `Secret-like output findings: ${outputScan.findings.length}`);

const source = execFileSync("cat", ["secrets/secretRedactionScanner.js"], { cwd: ROOT, encoding: "utf8" });
check(!source.includes("readFileSync(\".env"), "patterns", "Scanner must not read .env files");

const phaseStatus = JSON.parse(execFileSync("cat", ["os-roadmap/phase-status.json"], { cwd: ROOT, encoding: "utf8" }));
const p593 = phaseStatus.phases.find((phase) => phase.phaseId === "P59.3");
check(p593?.status === "complete", "phaseStatus", "P59.3 must be complete");
check(p593?.nextPhase === "P59.4", "phaseStatus", "P59.3 nextPhase must be P59.4");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: "- Secret-like scanner validates fake placeholders and P59 output files.\n- `.env` reads are explicitly blocked." },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Secret Redaction Report", metadata: { phase: "P59.3 - Redaction Tests" } },
);
console.log("NEXUS Secret Redaction Check");
console.log("============================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
