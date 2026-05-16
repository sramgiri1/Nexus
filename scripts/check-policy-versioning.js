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
  buildPolicyVersionIndex,
  getPolicyVersion,
  listPolicyVersions,
  loadPolicyRegistry,
  summarizePolicyVersions,
  validatePolicyVersionIndex,
} from "../policy-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/policy-versioning-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "index", name: "Version index", status: "PASS", details: "" },
  { key: "lookup", name: "Version lookup", status: "PASS", details: "" },
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

check(existsSync(join(ROOT, "policy-center/policyVersioning.js")), "modules", "Missing policyVersioning.js");

const registry = loadPolicyRegistry();
const index = buildPolicyVersionIndex(registry);
const validation = validatePolicyVersionIndex(index);
const summary = summarizePolicyVersions(index);
check(validation.valid, "index", validation.errors.join("; "));
check(summary.versionCount >= registry.policies.length, "index", "Expected versions for all registry policies");
check(summary.previewOnly === true, "index", "Version index must be preview-only");
check(summary.policyMutationAllowed === false, "index", "Versioning must not mutate policies");

const costVersions = listPolicyVersions("cost-center", { index });
check(costVersions.length >= 1, "lookup", "Expected cost-center versions");
check(Boolean(getPolicyVersion("cost-center", costVersions[0]?.version, { index })), "lookup", "Version lookup failed");

const phaseStatus = JSON.parse(execFileSync("cat", ["os-roadmap/phase-status.json"], { cwd: ROOT, encoding: "utf8" }));
const p582 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.2");
check(p582?.status === "complete", "phaseStatus", "P58.2 must be complete");
check(p582?.nextPhase === "P58.3", "phaseStatus", "P58.2 nextPhase must be P58.3");

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
        `- Version records: ${summary.versionCount}`,
        `- Active versions: ${summary.activeVersions}`,
        "- Checksums are short summaries and do not expose policy contents or secrets.",
        "- Versioning is metadata-only and does not rewrite policy files.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Policy Versioning Report", metadata: { phase: "P58.2 - Policy Versioning" } },
);

console.log("NEXUS Policy Versioning Check");
console.log("=============================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
