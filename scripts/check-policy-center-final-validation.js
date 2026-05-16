import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/policy-center-final-validation-report.md");
const checks = [
  { key: "modules", name: "Policy Center modules", status: "PASS", details: "" },
  { key: "scripts", name: "Check scripts", status: "PASS", details: "" },
  { key: "reports", name: "Reports", status: "PASS", details: "" },
  { key: "ui", name: "Command Center UX", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "safety", name: "Safety boundaries", status: "PASS", details: "" },
  { key: "docs", name: "Docs", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function fail(key, details) {
  const row = checks.find((check) => check.key === key);
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

for (const file of [
  "policy-center/policyRegistry.js",
  "policy-center/policyVersioning.js",
  "policy-center/policyDiff.js",
  "policy-center/policySimulation.js",
  "policy-center/policyExceptionWorkflow.js",
  "policy-center/breakGlassPolicy.js",
  "policy-center/index.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing ${file}`);
}

for (const script of [
  "check:policy-registry",
  "check:policy-versioning",
  "check:policy-diff",
  "check:policy-simulation",
  "check:policy-exception-workflow",
  "check:break-glass-policy",
  "check:policy-center-final-validation",
]) {
  check(read("package.json").includes(`"${script}"`), "scripts", `Missing package script ${script}`);
}

for (const report of [
  "reports/policy-registry-report.md",
  "reports/policy-versioning-report.md",
  "reports/policy-diff-report.md",
  "reports/policy-simulation-report.md",
  "reports/policy-exception-workflow-report.md",
  "reports/break-glass-policy-report.md",
]) {
  check(existsSync(join(ROOT, report)), "reports", `Missing ${report}`);
  check(read(report).includes("Validation HEAD"), "reports", `${report} missing Validation HEAD wording`);
}

const ui = read("dashboard/src/pages/CommandCenterV2.jsx");
check(ui.includes("Policy Center"), "ui", "Policy Center route missing");
check(ui.includes("Runtime enforcement changes"), "ui", "Policy Center missing runtime enforcement copy");
check(ui.includes("Break-glass is disabled by default"), "ui", "Policy Center missing break-glass disabled copy");
check(read("dashboard/src/data/commandCenterRoutes.js").includes("/command-center/policies"), "ui", "Policy route missing");

const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
const p58 = phaseStatus.phases.find((phase) => phase.phaseId === "P58");
const p588 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.8");
check(p58?.status === "complete", "phaseStatus", "P58 must be complete");
check(p588?.status === "complete", "phaseStatus", "P58.8 must be complete");
check(phaseStatus.currentPhase === "P59" || phaseStatus.nextPhase === "P59", "phaseStatus", "P59 must be current or next");

for (const source of [
  read("policy/policy-center-registry-policy.json"),
  read("policy/policy-center-break-glass-policy.json"),
  read("policy-center/policySimulation.js"),
  read("policy-center/breakGlassPolicy.js"),
]) {
  check(!source.includes("providerCallsAllowed: true"), "safety", "Provider calls enabled in source");
  check(!source.includes("\"providerCallsAllowed\": true"), "safety", "Provider calls enabled in policy");
  check(!source.includes("\"dbWritesAllowed\": true"), "safety", "DB writes enabled in policy");
  check(!source.includes("\"projectMutationAllowed\": true"), "safety", "Project mutation enabled in policy");
  check(!source.includes("liveOverrideEnabled: true"), "safety", "Live policy override enabled");
}
for (const forbidden of ["fetch(", "https://", "openai.", "anthropic.", "xcodebuild"]) {
  check(!read("policy-center/policySimulation.js").includes(forbidden), "safety", `Forbidden runtime token in simulation: ${forbidden}`);
}

check(read("docs/architecture/POLICY_CENTER_GOVERNANCE_ADMIN.md").includes("P58"), "docs", "Policy Center architecture doc missing P58");
check(read("docs/codebase/MODULE_OWNERSHIP.md").includes("policy-center"), "docs", "Module ownership missing policy-center");
check(read("docs/codebase/TESTING_STRATEGY.md").includes("Policy Center"), "docs", "Testing strategy missing Policy Center");

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
        "- P58 closes with policy registry, versioning, diff, simulation, exception, break-glass, and Command Center UX foundations.",
        "- All policy workflows remain preview/read-only; runtime enforcement and live overrides are not enabled.",
        "- P59 Secrets and Credential Boundary is next.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Policy Center Final Validation Report", metadata: { phase: "P58.8 - Policy Center Final Validation" } },
);

console.log("NEXUS Policy Center Final Validation Check");
console.log("==========================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
