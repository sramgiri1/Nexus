import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  createSecretReference,
  getSecretReferenceSchema,
  listSecretReferences,
  summarizeSecretReferences,
  validateSecretReference,
  validateSecretReferenceRegistry,
} from "../secrets/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/secret-reference-model-report.md");
const checks = [
  { key: "schema", name: "Schema", status: "PASS", details: "" },
  { key: "registry", name: "Registry", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "docs", name: "Docs", status: "PASS", details: "" },
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

const schema = getSecretReferenceSchema();
check(schema.rawValuesAllowed === false, "schema", "Raw values must not be allowed");
check(schema.envReadsAllowed === false, "schema", ".env reads must not be allowed");

const sample = createSecretReference({ referenceId: "secret-ref-sample", label: "Sample Reference" });
check(validateSecretReference(sample).valid, "schema", "Valid sample reference failed validation");
const unsafe = createSecretReference({ referenceId: "unsafe", label: "Unsafe" });
unsafe.rawValue = "fake-secret-value";
check(!validateSecretReference(unsafe).valid, "schema", "rawValue must fail validation");

const refs = listSecretReferences();
const registryValidation = validateSecretReferenceRegistry(refs);
const summary = summarizeSecretReferences(refs);
check(registryValidation.valid, "registry", registryValidation.errors.join("; "));
check(summary.total >= 5, "registry", "Expected base secret references");
check(summary.unsafeReferences === 0, "registry", "Registry contains unsafe references");

const policy = JSON.parse(readFileSync(join(ROOT, "policy/secrets-boundary-policy.json"), "utf8"));
check(policy.secretValuesReadable === false, "policy", "Secret values must not be readable");
check(policy.secretValuesStored === false, "policy", "Secret values must not be stored");
check(policy.envFileReadsAllowed === false, "policy", ".env reads must be disabled");

check(existsSync(join(ROOT, "docs/architecture/SECRETS_AND_CREDENTIAL_BOUNDARY.md")), "docs", "Architecture doc missing");
check(readFileSync(join(ROOT, "docs/architecture/SECRETS_AND_CREDENTIAL_BOUNDARY.md"), "utf8").includes("P59.1"), "docs", "Doc missing P59.1");

const phaseStatus = JSON.parse(readFileSync(join(ROOT, "os-roadmap/phase-status.json"), "utf8"));
const p591 = phaseStatus.phases.find((phase) => phase.phaseId === "P59.1");
check(p591?.status === "complete", "phaseStatus", "P59.1 must be complete");
check(p591?.nextPhase === "P59.2", "phaseStatus", "P59.1 nextPhase must be P59.2");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: [
        `- Secret references modeled: ${summary.total}`,
        `- References requiring approval: ${summary.requiresApproval}`,
        "- Raw secret values are not stored, read, or printed.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Secret Reference Model Report", metadata: { phase: "P59.1 - Secret Reference Model" } },
);

console.log("NEXUS Secret Reference Model Check");
console.log("==================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
