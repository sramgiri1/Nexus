import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import { loadPolicyRegistry, summarizePolicyRegistry, validatePolicyRegistry } from "../policy-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/policy-registry-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "registry", name: "Policy registry", status: "PASS", details: "" },
  { key: "schema", name: "Schema and policy", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function fail(key, details) {
  const check = checks.find((item) => item.key === key);
  if (check) {
    check.status = "FAIL";
    check.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) fail(key, details);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

check(existsSync(join(ROOT, "policy-center/policyRegistry.js")), "modules", "Missing policyRegistry.js");
check(existsSync(join(ROOT, "policy-center/index.js")), "modules", "Missing policy-center index");

const registry = loadPolicyRegistry();
const validation = validatePolicyRegistry(registry);
const summary = summarizePolicyRegistry(registry);
check(validation.valid, "registry", validation.errors.join("; "));
check(summary.policyCount >= 16, "registry", "Expected at least 16 policy families");
check(summary.previewOnly === true, "registry", "Registry must be preview-only");
check(summary.runtimeEnforcementChanged === false, "registry", "Registry must not change enforcement");
for (const policy of registry.policies) {
  check(Boolean(policy.commandCenterVisible), "registry", `${policy.policyId} missing Command Center visibility`);
  check(
    policy.status === "planned" || existsSync(join(ROOT, policy.sourcePath)),
    "registry",
    `${policy.policyId} sourcePath missing without planned status`,
  );
}

const schema = readJson("policy-center/policyRegistry.schema.json");
const policy = readJson("policy/policy-center-registry-policy.json");
check(schema.previewOnly === true, "schema", "Schema must be preview-only");
check(policy.runtimeEnforcementChangesAllowed === false, "schema", "Runtime enforcement changes must be disabled");

const phaseStatus = readJson("os-roadmap/phase-status.json");
const p581 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.1");
check(p581?.status === "complete", "phaseStatus", "P58.1 must be complete");
check(p581?.nextPhase === "P58.2", "phaseStatus", "P58.1 nextPhase must be P58.2");

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
        `- Policy families registered: ${summary.policyCount}`,
        `- Active policy sources: ${summary.activePolicies}`,
        `- High-risk or critical policy areas: ${summary.highRiskPolicies}`,
        "- Registry is read-only and does not change runtime enforcement.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Policy Registry Report", metadata: { phase: "P58.1 - Policy Registry" } },
);

console.log("NEXUS Policy Registry Check");
console.log("===========================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
