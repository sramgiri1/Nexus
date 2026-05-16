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
const REPORT_PATH = join(ROOT, "reports/cost-center-final-validation-report.md");
const checks = [
  { key: "modules", name: "Cost Center modules", status: "PASS", details: "" },
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
  "cost-center/costLedgerSchema.js",
  "cost-center/budgetModel.js",
  "cost-center/costEstimator.js",
  "cost-center/costRecorder.js",
  "cost-center/budgetEnforcer.js",
  "cost-center/costPolicy.js",
  "cost-center/index.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing ${file}`);
}

for (const script of [
  "check:cost-center-ledger",
  "check:budget-model",
  "check:cost-estimator",
  "check:cost-recorder",
  "check:budget-enforcer",
  "check:cost-center-command-ui",
  "check:cost-center-final-validation",
]) {
  check(read("package.json").includes(`"${script}"`), "scripts", `Missing package script ${script}`);
}

for (const report of [
  "reports/cost-center-ledger-report.md",
  "reports/budget-model-report.md",
  "reports/cost-estimator-report.md",
  "reports/cost-recorder-report.md",
  "reports/budget-enforcer-report.md",
  "reports/cost-center-command-ui-report.md",
]) {
  check(existsSync(join(ROOT, report)), "reports", `Missing ${report}`);
  check(read(report).includes("Validation HEAD"), "reports", `${report} missing Validation HEAD wording`);
}

const ui = read("dashboard/src/pages/CommandCenterV2.jsx");
check(ui.includes("Ready for estimates"), "ui", "Cost Center UX missing estimate status");
check(ui.includes("Real provider spend"), "ui", "Cost Center UX missing real spend disabled copy");
check(ui.includes("REQUIRE_APPROVAL"), "ui", "Cost Center UX missing approval decision");

const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
const p57 = phaseStatus.phases.find((phase) => phase.phaseId === "P57");
const p577 = phaseStatus.phases.find((phase) => phase.phaseId === "P57.7");
check(p57?.status === "complete", "phaseStatus", "P57 must be complete");
check(p577?.status === "complete", "phaseStatus", "P57.7 must be complete");
check(phaseStatus.currentPhase === "P58" || phaseStatus.nextPhase === "P58", "phaseStatus", "P58 must be current or next");

for (const source of [
  read("policy/cost-center-policy.json"),
  read("cost-center/costEstimator.js"),
  read("cost-center/budgetEnforcer.js"),
  read("dashboard/src/pages/CommandCenterV2.jsx"),
]) {
  check(!source.includes("providerDispatchAllowed: true"), "safety", "Provider dispatch enabled in source");
  check(!source.includes("\"realProviderSpendAllowed\": true"), "safety", "Real provider spend enabled in policy");
}
for (const forbidden of ["fetch(", "https://", "openai.chat", "anthropic.messages", "xcodebuild"]) {
  check(!read("cost-center/costEstimator.js").includes(forbidden), "safety", `Forbidden runtime token in estimator: ${forbidden}`);
}

check(read("docs/architecture/COST_CENTER_BUDGET_ENFORCEMENT.md").includes("P57"), "docs", "Cost Center architecture doc missing");
check(read("docs/codebase/MODULE_OWNERSHIP.md").includes("cost-center"), "docs", "Module ownership missing cost-center");

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
        "- P57 closes with ledger, budget, estimator, recorder, enforcer, and Command Center UX foundations.",
        "- Cost Center remains preview-only; no real provider spend or runtime execution is enabled.",
        "- P58 Policy Center + Governance Admin is next.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Cost Center Final Validation Report", metadata: { phase: "P57.7 - Cost Center Final Validation" } },
);

console.log("NEXUS Cost Center Final Validation Check");
console.log("========================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
